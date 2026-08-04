import { createHash } from "node:crypto";

const PAYSTACK_REFERENCE_PATTERN = /^[A-Za-z0-9.=-]{1,200}$/;

export interface PaystackOrderIdentity {
  orderId: string;
  orderNumber: string;
  referenceHash: string;
}

export function getPaystackOrderIdentity(
  reference: string,
): PaystackOrderIdentity {
  if (!PAYSTACK_REFERENCE_PATTERN.test(reference)) {
    throw new Error("Invalid Paystack transaction reference");
  }

  const referenceHash = createHash("sha256").update(reference).digest("hex");

  return {
    orderId: `order.paystack.${referenceHash}`,
    orderNumber: `ORD-${referenceHash.slice(0, 12).toUpperCase()}`,
    referenceHash,
  };
}
