"use server";

import Stripe from "stripe";
import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Gets or creates a Stripe customer by email
 * Also syncs the customer to Sanity database
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<{ stripeCustomerId: string; sanityCustomerId: string }> {
  // First, check if customer already exists in Sanity
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer?.stripeCustomerId) {
    // Verify that this customer actually exists in Stripe
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        existingCustomer.stripeCustomerId
      );

      if (stripeCustomer && !stripeCustomer.deleted) {
        // Customer exists and is valid, return existing IDs
        return {
          stripeCustomerId: existingCustomer.stripeCustomerId,
          sanityCustomerId: existingCustomer._id,
        };
      }
    } catch (error) {
      console.warn(
        `Stripe customer ${existingCustomer.stripeCustomerId} found in Sanity but not in Stripe. Creating new one.`
      );
    }
    // If we get here, the customer ID in Sanity is invalid/deleted.
    // We proceed to create a new one or find by email below.
  }

  // Check if customer exists in Stripe by email
  const existingStripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomerId: string;

  if (existingStripeCustomers.data.length > 0) {
    // Customer exists in Stripe
    stripeCustomerId = existingStripeCustomers.data[0].id;
  } else {
    // Create new Stripe customer
    const newStripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        clerkUserId,
      },
    });
    stripeCustomerId = newStripeCustomer.id;
  }

  // Create or update customer in Sanity
  if (existingCustomer) {
    // Update existing Sanity customer with Stripe ID
    await writeClient
      .patch(existingCustomer._id)
      .set({ stripeCustomerId, clerkUserId, name })
      .commit();
    return {
      stripeCustomerId,
      sanityCustomerId: existingCustomer._id,
    };
  }

  // Create new customer in Sanity
  const newSanityCustomer = await writeClient.create({
    _type: "customer",
    email,
    name,
    clerkUserId,
    stripeCustomerId,
    createdAt: new Date().toISOString(),
  });

  return {
    stripeCustomerId,
    sanityCustomerId: newSanityCustomer._id,
  };
}
