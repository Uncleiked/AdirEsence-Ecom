"use server";

import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

/**
 * Gets or creates a Paystack customer by email
 * Also syncs the customer to Sanity database
 */
export async function getOrCreatePaystackCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<{ paystackCustomerCode: string; sanityCustomerId: string }> {
  // First, check if customer already exists in Sanity
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer?.paystackCustomerCode) {
    // Verify that this customer actually exists in Paystack
    try {
      const response = await fetch(`https://api.paystack.co/customer/${existingCustomer.paystackCustomerCode}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status && result.data) {
          return {
            paystackCustomerCode: existingCustomer.paystackCustomerCode,
            sanityCustomerId: existingCustomer._id,
          };
        }
      }
    } catch (error) {
      console.warn(
        `Paystack customer ${existingCustomer.paystackCustomerCode} found in Sanity but failed to verify on Paystack. Re-creating/fetching.`
      );
    }
  }

  // Create or fetch from Paystack
  let paystackCustomerCode: string = "";

  try {
    const firstName = name.split(" ")[0] || "";
    const lastName = name.split(" ").slice(1).join(" ") || "";

    const response = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        metadata: {
          clerkUserId,
        },
      }),
    });

    const result = await response.json();
    if (response.ok && result.status && result.data) {
      paystackCustomerCode = result.data.customer_code;
    } else {
      // If customer already exists, Paystack API might return success with existing customer data
      // or we can fetch them by email if needed, but usually POST /customer returns the existing one if email matches.
      throw new Error(result.message || "Failed to create customer on Paystack");
    }
  } catch (error) {
    console.error("Error creating customer on Paystack:", error);
    // If creation fails because customer email exists, we can retrieve customer by email/id via Paystack API
    try {
      const getResponse = await fetch(`https://api.paystack.co/customer/${email}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });
      const getResult = await getResponse.json();
      if (getResponse.ok && getResult.status && getResult.data) {
        paystackCustomerCode = getResult.data.customer_code;
      } else {
        throw new Error("Could not find or create Paystack customer");
      }
    } catch (innerError) {
      throw new Error(`Paystack Customer Integration Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  // Create or update customer in Sanity
  if (existingCustomer) {
    // Update existing Sanity customer with Paystack code
    await writeClient
      .patch(existingCustomer._id)
      .set({ paystackCustomerCode, clerkUserId, name })
      .commit();
    return {
      paystackCustomerCode,
      sanityCustomerId: existingCustomer._id,
    };
  }

  // Create new customer in Sanity
  const newSanityCustomer = await writeClient.create({
    _type: "customer",
    email,
    name,
    clerkUserId,
    paystackCustomerCode,
    createdAt: new Date().toISOString(),
  });

  return {
    paystackCustomerCode,
    sanityCustomerId: newSanityCustomer._id,
  };
}
