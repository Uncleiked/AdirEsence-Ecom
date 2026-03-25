import { writeClient } from "../sanity/lib/client";

async function main() {
  try {
    const orderItems = [
      {
        _key: `item-0`,
        product: {
          _type: "reference" as const,
          _ref: "dummy-product-id", // Assume this doesn't matter or fails fast with valid type error
        },
        quantity: 1,
        priceAtPurchase: 1000,
      },
    ];

    const orderNumber = `ORD-TEST-1234`;

    const address = {
      name: "Test User",
      line1: "123 Test St",
      line2: "",
      city: "Test City",
      postcode: "12345",
      country: "US",
    };

    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      clerkUserId: "user_213",
      email: "test@example.com",
      items: orderItems,
      total: 1000,
      status: "paid",
      stripePaymentId: "pi_" + Math.random(),
      address,
      createdAt: new Date().toISOString(),
    });

    console.log("Order created:", order._id);
  } catch (err: any) {
    console.error("Caught Error:");
    if (err.response && err.response.body) {
      console.error(JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err.message, err.details || err);
    }
  }
}

main();
