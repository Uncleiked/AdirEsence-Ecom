import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";
import type { Order } from "@/sanity.types";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-paystack-signature header" },
      { status: 400 }
    );
  }

  // Verify signature using HMAC SHA512
  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    console.error("Paystack webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.event === "charge.success") {
    try {
      await handleChargeSuccess(event.data);
    } catch (error) {
      console.error("Error processing Paystack charge.success webhook:", error);
      return NextResponse.json(
        { error: "Error processing payment webhook" },
        { status: 500 }
      );
    }
  } else {
    console.log(`Unhandled Paystack event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference;

  // 1. Idempotency Check
  const existingOrder = await client.fetch(ORDER_BY_PAYMENT_ID_QUERY, {
    paymentId: reference,
  });

  if (existingOrder) {
    console.log(`Paystack webhook already processed for ref ${reference}, skipping`);
    return;
  }

  // 2. Extract metadata and details
  const {
    clerkUserId,
    userEmail,
    sanityCustomerId,
    productIds: productIdsString,
    quantities: quantitiesString,
    shippingFee,
    serviceCharge,
    address,
  } = data.metadata ?? {};

  if (!clerkUserId || !productIdsString || !quantitiesString) {
    console.error("Missing required metadata in Paystack checkout transaction:", reference);
    return;
  }

  const productIds = productIdsString.split(",");
  const quantities = quantitiesString.split(",").map(Number);

  // 3. Build order items array
  // We can construct line items from product ids
  // Since we don't have direct Stripe-like API for listing line items,
  // we fetch products by id to confirm price at purchase
  const products = await client.fetch(
    `*[_type == "product" && _id in $productIds] { _id, price }`,
    { productIds }
  );

  const orderItems = productIds.map((productId: string, index: number) => {
    const product = products.find((p: any) => p._id === productId);
    return {
      _key: `item-${index}`,
      product: {
        _type: "reference" as const,
        _ref: productId,
      },
      quantity: quantities[index],
      priceAtPurchase: product ? product.price : 0,
    };
  });

  // 4. Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 5. Create order in Sanity
  const orderData: Omit<Order, "_id" | "_createdAt" | "_updatedAt" | "_rev"> = {
    _type: "order",
    orderNumber,
    ...(sanityCustomerId && {
      customer: {
        _type: "reference",
        _ref: sanityCustomerId,
      },
    }),
    clerkUserId,
    email: userEmail ?? data.customer.email ?? "",
    items: orderItems as any,
    total: data.amount / 100, // Convert kobo to NGN
    status: "paid",
    paymentId: reference,
    paymentProvider: "paystack",
    shippingFee: shippingFee || 0,
    serviceCharge: serviceCharge || 0,
    address: address ? {
      name: address.name,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      postcode: address.postcode,
      country: address.country,
    } : undefined,
    createdAt: new Date().toISOString(),
  };

  const order = await writeClient.create(orderData);
  console.log(`Paystack Order created: ${order._id} (${orderNumber}) for reference ${reference}`);

  // 6. Decrease stock for all products in a single transaction
  await productIds
    .reduce(
      (tx: any, productId: string, i: number) =>
        tx.patch(productId, (p: any) => p.dec({ stock: quantities[i] })),
      writeClient.transaction()
    )
    .commit();

  console.log(`Stock updated for ${productIds.length} products (Paystack payment)`);
}
