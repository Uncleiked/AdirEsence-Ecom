import assert from "node:assert/strict";
import test from "node:test";
import { checkoutItemsSchema } from "../lib/validation/checkout.ts";
import {
  calculateRemainingStock,
  findInventoryShortages,
} from "../lib/payments/order-fulfillment.ts";
import { takeRateLimit } from "../lib/security/rate-limit.ts";
import { paystackReturnedMetadataSchema } from "../lib/payments/paystack-validation.ts";

const validItem = {
  productId: "product-1",
  name: "Chair",
  price: 50_000,
  quantity: 1,
  slug: "chair",
};

test("checkout accepts the complete persisted cart item shape", () => {
  const result = checkoutItemsSchema.safeParse([
    { ...validItem, image: "https://cdn.example.com/chair.jpg" },
  ]);

  assert.equal(result.success, true);
});

test("checkout still rejects genuinely unknown cart fields", () => {
  const result = checkoutItemsSchema.safeParse([
    { ...validItem, injectedTotal: 1 },
  ]);

  assert.equal(result.success, false);
});

test("checkout rejects non-positive, fractional, and non-finite quantities", () => {
  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(
      checkoutItemsSchema.safeParse([{ ...validItem, quantity }]).success,
      false,
    );
  }
});

test("checkout rejects duplicate product IDs", () => {
  const result = checkoutItemsSchema.safeParse([
    validItem,
    { ...validItem, quantity: 2 },
  ]);

  assert.equal(result.success, false);
});

test("inventory assessment reports missing and insufficient products", () => {
  const shortages = findInventoryShortages(
    [
      { productId: "missing", name: "Missing", quantity: 1, unitPrice: 100 },
      { productId: "low", name: "Low", quantity: 3, unitPrice: 100 },
      { productId: "ready", name: "Ready", quantity: 2, unitPrice: 100 },
    ],
    [
      { _id: "low", _rev: "rev-low", stock: 2 },
      { _id: "ready", _rev: "rev-ready", stock: 2 },
    ],
  );

  assert.deepEqual(shortages, [
    { productId: "missing", name: "Missing", requested: 1, available: 0 },
    { productId: "low", name: "Low", requested: 3, available: 2 },
  ]);
});

test("inventory subtracts the purchased quantity exactly", () => {
  assert.equal(calculateRemainingStock(5, 2), 3);
  assert.throws(() => calculateRemainingStock(1, 2));
});

test("Paystack-returned string metadata is safely normalized", () => {
  const result = paystackReturnedMetadataSchema.safeParse({
    version: "1",
    clerkUserId: "user_123",
    userEmail: "customer@example.com",
    sanityCustomerId: "customer.clerk.123",
    items: [
      {
        productId: "product-1",
        name: "Adire shirt",
        quantity: "2",
        unitPrice: "34000",
      },
    ],
    shippingFee: "50",
    serviceCharge: "0",
    expectedAmountKobo: "6805000",
    address: {
      name: "Customer",
      email: "customer@example.com",
      phone: "+2349000000000",
      line1: "1 Test Street",
      line2: "",
      city: "Lagos",
      state: "Lagos",
      postcode: "100001",
      country: "NG",
    },
    cancel_action: "http://localhost:3000/shop/declined",
    referrer: "http://localhost:3000/shop/checkout",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.version, 1);
    assert.equal(result.data.items[0]?.quantity, 2);
    assert.equal(result.data.items[0]?.unitPrice, 34_000);
    assert.equal(result.data.shippingFee, 50);
    assert.equal(result.data.expectedAmountKobo, 6_805_000);
  }
});

test("rate limiter blocks calls over the configured window limit", () => {
  const key = `test:${Date.now()}:${Math.random()}`;
  assert.equal(
    takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed,
    true,
  );
  assert.equal(
    takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed,
    true,
  );
  assert.equal(
    takeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed,
    false,
  );
});
