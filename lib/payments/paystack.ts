import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PaystackCheckoutMetadata } from "@/lib/validation/checkout";

const paystackInitializeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      authorization_url: z.string().url(),
      access_code: z.string(),
      reference: z.string(),
    })
    .optional(),
});

const paystackVerifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      status: z.string(),
      reference: z.string(),
    })
    .passthrough()
    .optional(),
});

export interface InitializePaystackTransactionInput {
  email: string;
  amountKobo: number;
  metadata: PaystackCheckoutMetadata;
  baseUrl: string;
}

export async function initializePaystackTransaction({
  email,
  amountKobo,
  metadata,
  baseUrl,
}: InitializePaystackTransactionInput): Promise<{
  authorizationUrl: string;
  reference: string;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const reference = `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().replaceAll("-", "")}`;
  const callbackUrl = new URL("/api/paystack/callback", baseUrl);
  const cancelUrl = new URL("/shop/declined", baseUrl);
  cancelUrl.searchParams.set("reference", reference);

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrl.toString(),
        metadata: {
          ...metadata,
          cancel_action: cancelUrl.toString(),
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  const responseBody: unknown = await response.json().catch(() => null);
  const result = paystackInitializeResponseSchema.safeParse(responseBody);

  if (
    !response.ok ||
    !result.success ||
    !result.data.status ||
    !result.data.data?.authorization_url
  ) {
    console.error("Paystack transaction initialization failed", {
      status: response.status,
      responseValid: result.success,
    });
    throw new Error("Failed to initialize Paystack payment");
  }

  if (result.data.data.reference !== reference) {
    throw new Error("Paystack returned an unexpected transaction reference");
  }

  return {
    authorizationUrl: result.data.data.authorization_url,
    reference,
  };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<unknown> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  if (!/^[A-Za-z0-9.=-]{1,200}$/.test(reference)) {
    throw new Error("Invalid Paystack transaction reference");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  const responseBody: unknown = await response.json().catch(() => null);
  const result = paystackVerifyResponseSchema.safeParse(responseBody);

  if (
    !response.ok ||
    !result.success ||
    !result.data.status ||
    !result.data.data
  ) {
    throw new Error("Paystack could not verify the transaction");
  }

  if (result.data.data.reference !== reference) {
    throw new Error("Paystack returned an unexpected transaction reference");
  }

  return result.data.data;
}
