import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  fulfillPaidOrder,
  paystackSuccessfulTransactionSchema,
} from "@/lib/payments/paystack-order";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

export const runtime = "nodejs";

function redirectTo(
  request: Request,
  pathname: string,
  parameters: Record<string, string | undefined>,
) {
  const destination = new URL(pathname, request.url);
  for (const [name, value] of Object.entries(parameters)) {
    if (value) destination.searchParams.set(name, value);
  }
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const { userId } = await auth();
  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  if (!/^[A-Za-z0-9.=-]{1,200}$/.test(reference)) {
    return redirectTo(request, "/shop/declined", {
      status: "invalid_reference",
    });
  }

  let verification: unknown;
  try {
    verification = await verifyPaystackTransaction(reference);
  } catch (error) {
    console.error("Paystack callback verification failed", error);
    return redirectTo(request, "/shop/declined", {
      reference,
      status: "verification_failed",
    });
  }

  const verifiedTransaction = paystackSuccessfulTransactionSchema.safeParse(
    verification,
  );

  if (!verifiedTransaction.success) {
    const returnedStatus =
      typeof verification === "object" &&
      verification !== null &&
      "status" in verification &&
      typeof verification.status === "string"
        ? verification.status
        : "verification_failed";

    console.error("Paystack transaction verification payload was rejected", {
      returnedStatus,
      issues: verifiedTransaction.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join("."),
      })),
    });

    return redirectTo(request, "/shop/declined", {
      reference,
      status:
        returnedStatus === "success" ? "verification_failed" : returnedStatus,
    });
  }

  // Paystack may return to this endpoint without the browser's Clerk cookie.
  // Fulfillment is still safe because the charge was verified server-to-server;
  // ownership is enforced again by the protected success page.
  if (userId && verifiedTransaction.data.metadata.clerkUserId !== userId) {
    return redirectTo(request, "/shop/declined", {
      status: "invalid_reference",
    });
  }

  try {
    await fulfillPaidOrder(verifiedTransaction.data);
  } catch (error) {
    // The protected success page retries the same verified, idempotent
    // fulfillment flow. A successful charge must never be labelled declined
    // merely because Sanity was temporarily unavailable during the callback.
    console.error("Verified Paystack order fulfillment will be retried", error);
  }

  return redirectTo(request, "/shop/success", { reference });
}
