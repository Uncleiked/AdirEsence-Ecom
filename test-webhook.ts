import { writeClient, client } from "./sanity/lib/client";

async function run() {
  try {
    const orderData = {
      _type: "order",
      orderNumber: "TEST-123",
      clerkUserId: "user_123",
      email: "test@example.com",
      items: [
        {
          _key: "item-0",
          product: {
            _type: "reference",
            _ref: "nonexistent-product-id", // let's see if this fails
          },
          quantity: 1,
          priceAtPurchase: 100,
        }
      ],
      total: 100,
      status: "paid",
      stripePaymentId: "pi_test",
      address: {
        name: "Test",
        line1: "123 Test St",
        line2: "",
        city: "Test",
        postcode: "12345",
        country: "US"
      },
      createdAt: new Date().toISOString(),
    };

    console.log("Creating order...");
    const res = await writeClient.create(orderData);
    console.log("Success:", res._id);
  } catch (e) {
    console.error("Error creating order:", e.message);
  }
}
run();
