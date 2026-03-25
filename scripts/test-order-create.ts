import { writeClient } from "../sanity/lib/client";
import type { Order } from "../sanity.types";

async function main() {
  const orderData: Omit<Order, "_id" | "_createdAt" | "_updatedAt" | "_rev"> = {
    _type: "order",
    orderNumber: "TEST-ORDER-001",
    total: 100,
    status: "paid",
    createdAt: new Date().toISOString(),
    stripePaymentId: "test_stripe_payment_id",
    // optional fields can be omitted
  };
  try {
    const result = await writeClient.create(orderData);
    console.log("Order created:", result);
  } catch (err) {
    console.error("Error creating order:", err);
  }
}

main();
