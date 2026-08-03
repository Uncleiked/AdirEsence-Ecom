import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fulfillPaidOrder, paystackSuccessfulTransactionSchema } from "@/lib/payments/paystack-order";
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
  if (!userId) {
    return redirectTo(request, "/", {});
  }

  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  if (!/^[A-Za-z0-9.=-]{1,200}$/.test(reference)) {
    return redirectTo(request, "/shop/declined", {
      status: "invalid_reference",
    });
  }

  try {
    const verification = await verifyPaystackTransaction(reference);
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
          returnedStatus === "success"
            ? "verification_failed"
            : returnedStatus,
      });
    }

    if (verifiedTransaction.data.metadata.clerkUserId !== userId) {
      return redirectTo(request, "/shop/declined", {
        status: "invalid_reference",
      });
    }

    await fulfillPaidOrder(verifiedTransaction.data);
    return redirectTo(request, "/shop/success", { reference });
  } catch (error) {
    console.error("Paystack callback verification failed", error);
    return redirectTo(request, "/shop/declined", {
      reference,
      status: "verification_failed",
    });
  }
}
