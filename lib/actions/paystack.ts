"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { getOrCreatePaystackCustomer } from "@/lib/actions/paystack-customer";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

interface PaystackCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Initializes a Paystack checkout transaction
 */
export async function createPaystackCheckoutSession(
  items: CartItem[],
  address: Address,
  shippingFee: number,
  serviceCharge: number
): Promise<PaystackCheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate inputs
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    if (!address.name || !address.line1 || !address.city || !address.country) {
      return { success: false, error: "Invalid shipping address details" };
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate each item and calculate net subtotal
    const validationErrors: string[] = [];
    let netSubtotal = 0;

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }

      netSubtotal += (product.price ?? 0) * item.quantity;
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // 5. Get or create Paystack customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName = address.name;

    const { paystackCustomerCode, sanityCustomerId } =
      await getOrCreatePaystackCustomer(userEmail, userName, userId);

    // 6. Calculate total amount in kobo (NGN * 100)
    // Gross = Net Subtotal + Shipping + Service Charge
    const totalAmountNGN = netSubtotal + shippingFee + serviceCharge;
    const totalAmountKobo = Math.round(totalAmountNGN * 100);

    // 7. Prepare unique reference
    const reference = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 8. Prepare metadata
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      productIds: items.map((i) => i.productId).join(","),
      quantities: items.map((i) => i.quantity).join(","),
      shippingFee,
      serviceCharge,
      address: {
        name: address.name,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        postcode: address.postcode,
        country: address.country,
      },
    };

    // 9. Prepare redirect callback URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    const callbackUrl = `${baseUrl}/shop/checkout/success?session_id=${reference}`;

    // 10. Call Paystack Transaction Initialize API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: totalAmountKobo,
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    });

    const result = await response.json();

    if (response.ok && result.status && result.data?.authorization_url) {
      return { success: true, url: result.data.authorization_url };
    } else {
      console.error("Paystack transaction initialize failed:", result);
      return {
        success: false,
        error: result.message || "Failed to initialize Paystack payment",
      };
    }
  } catch (error) {
    console.error("Paystack checkout action error:", error);
    return {
      success: false,
      error: "Something went wrong initializing Paystack. Please try again.",
    };
  }
}
