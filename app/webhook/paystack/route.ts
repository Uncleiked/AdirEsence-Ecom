import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fulfillPaidOrder,
  paystackSuccessfulTransactionSchema,
} from "@/lib/payments/paystack-order";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 1_000_000;
const paystackChargeEventSchema = z
  .object({
    event: z.literal("charge.success"),
    data: paystackSuccessfulTransactionSchema,
  })
  .passthrough();

function signaturesMatch(expected: string, received: string): boolean {
  if (!/^[a-fA-F0-9]{128}$/.test(received)) return false;

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Payment webhook is unavailable" },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = createHmac("sha512", secretKey)
    .update(body)
    .digest("hex");
  if (!signaturesMatch(expectedSignature, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("event" in payload) ||
    payload.event !== "charge.success"
  ) {
    return NextResponse.json({ received: true });
  }

  const event = paystackChargeEventSchema.safeParse(payload);
  if (!event.success) {
    console.error("Rejected malformed Paystack charge.success webhook", {
      issues: event.error.issues.map((issue) => issue.path.join(".")),
    });
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  try {
    await fulfillPaidOrder(event.data.data);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Paystack charge.success webhook", error);
    return NextResponse.json(
      { error: "Error processing payment webhook" },
      { status: 500 },
    );
  }
}
