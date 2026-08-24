import assert from "node:assert/strict";
import test from "node:test";
import { checkoutItemsSchema } from "../lib/validation/checkout.ts";
import {
  aggregatePurchasedItems,
  calculateRemainingStock,
  findInventoryShortages,
} from "../lib/payments/order-fulfillment.ts";
import { takeRateLimit } from "../lib/security/rate-limit.ts";
import { paystackReturnedMetadataSchema } from "../lib/payments/paystack-validation.ts";
import { resolveCheckoutBaseUrl } from "../lib/payments/app-url.ts";
import { getPaystackOrderIdentity } from "../lib/payments/paystack-reference.ts";
import {
  GARMENT_SIZING_VERSION,
  ALPHA_SIZES,
  createCartLineId,
  resolveGarmentSizingMode,
  validateGarmentSizing,
  validateProductSizing,
  type GarmentSizing,
} from "../lib/sizing/garment-sizing.ts";

const validItem = {
  lineId: "product-1",
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

test("checkout rejects duplicate cart line IDs", () => {
  const result = checkoutItemsSchema.safeParse([
    validItem,
    { ...validItem, quantity: 2 },
  ]);

  assert.equal(result.success, false);
});

const trouserSizing: GarmentSizing = {
  version: GARMENT_SIZING_VERSION,
  mode: "trouser",
  fitProfile: "women",
  unit: "in",
  waist: 30,
  hip: 40,
  length: 32,
  lengthType: "insideLeg",
};

test("checkout accepts separate measurement configurations for one product", () => {
  const secondSizing: GarmentSizing = {
    ...trouserSizing,
    fitProfile: "men",
    waist: 34,
    hip: 42,
  };
  const result = checkoutItemsSchema.safeParse([
    {
      ...validItem,
      lineId: createCartLineId(validItem.productId, trouserSizing),
      sizing: trouserSizing,
    },
    {
      ...validItem,
      lineId: createCartLineId(validItem.productId, secondSizing),
      sizing: secondSizing,
    },
  ]);

  assert.equal(result.success, true);
});

test("checkout accepts every supported compulsory shirt size", () => {
  for (const alphaSize of ALPHA_SIZES) {
    const result = checkoutItemsSchema.safeParse([
      {
        ...validItem,
        lineId: createCartLineId(validItem.productId, undefined, alphaSize),
        alphaSize,
      },
    ]);
    assert.equal(result.success, true, `expected ${alphaSize} to be accepted`);
  }
});

test("garment sizing applies category-specific meanings and ranges", () => {
  assert.equal(resolveGarmentSizingMode({ slug: "jorts" }), "shorts");
  assert.equal(resolveGarmentSizingMode({ slug: "skirts" }), "skirt");
  assert.equal(resolveGarmentSizingMode({ slug: "shirts" }), "alpha");
  assert.deepEqual(validateGarmentSizing(trouserSizing, "trouser"), []);
  assert.match(
    validateGarmentSizing(
      {
        ...trouserSizing,
        mode: "shorts",
        lengthType: "shortInseam",
        length: 32,
      },
      "shorts",
    )[0] ?? "",
    /between 2 and 20 in/,
  );
  assert.match(
    validateGarmentSizing(undefined, "skirt")[0] ?? "",
    /measurements/i,
  );
});

test("letter-size categories require a size and reject measurements", () => {
  assert.match(
    validateProductSizing(undefined, undefined, "alpha")[0] ?? "",
    /choose a shirt size/i,
  );
  assert.deepEqual(validateProductSizing(undefined, "3XL", "alpha"), []);
  assert.match(
    validateProductSizing(trouserSizing, "M", "trouser").at(-1) ?? "",
    /letter size is not accepted/i,
  );
});

test("stock quantities aggregate across differently sized lines", () => {
  assert.deepEqual(
    aggregatePurchasedItems([
      { productId: "same", name: "Trouser", quantity: 1, unitPrice: 100 },
      { productId: "same", name: "Trouser", quantity: 2, unitPrice: 100 },
    ]),
    [{ productId: "same", name: "Trouser", quantity: 3, unitPrice: 100 }],
  );

  assert.deepEqual(
    findInventoryShortages(
      [
        { productId: "same", name: "Trouser", quantity: 1, unitPrice: 100 },
        { productId: "same", name: "Trouser", quantity: 2, unitPrice: 100 },
      ],
      [{ _id: "same", _rev: "rev", stock: 2 }],
    ),
    [{ productId: "same", name: "Trouser", requested: 3, available: 2 }],
  );
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

test("Paystack metadata retains garment measurements", () => {
  const result = paystackReturnedMetadataSchema.safeParse({
    version: "2",
    clerkUserId: "user_123",
    userEmail: "customer@example.com",
    sanityCustomerId: "customer.clerk.123",
    items: [
      {
        productId: "product-1",
        name: "Adire trouser",
        quantity: "1",
        unitPrice: "34000",
        sizing: {
          ...trouserSizing,
          version: "1",
          waist: "30",
          hip: "40",
          length: "32",
        },
      },
    ],
    shippingFee: "50",
    serviceCharge: "0",
    expectedAmountKobo: "3405000",
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
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.version, 2);
    assert.equal(result.data.items[0]?.sizing?.waist, 30);
    assert.equal(result.data.items[0]?.sizing?.lengthType, "insideLeg");
  }
});

test("Paystack metadata retains a selected shirt size", () => {
  const result = paystackReturnedMetadataSchema.safeParse({
    version: "3",
    clerkUserId: "user_123",
    userEmail: "customer@example.com",
    sanityCustomerId: "customer.clerk.123",
    items: [
      {
        productId: "shirt-1",
        name: "Adire shirt",
        quantity: "1",
        unitPrice: "25000",
        alphaSize: "4XL",
      },
    ],
    shippingFee: "50",
    serviceCharge: "0",
    expectedAmountKobo: "2505000",
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
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.version, 3);
    assert.equal(result.data.items[0]?.alphaSize, "4XL");
  }
});

test("checkout returns to the initiating custom domain instead of a Vercel preview", () => {
  assert.equal(
    resolveCheckoutBaseUrl({
      requestOrigin: "https://www.adiressence.store",
      forwardedHost: "adiressence-preview.vercel.app",
      forwardedProto: "https",
      vercelUrl: "adiressence-preview.vercel.app",
    }),
    "https://www.adiressence.store",
  );
});

test("an explicitly configured checkout URL remains canonical", () => {
  assert.equal(
    resolveCheckoutBaseUrl({
      configuredUrl: "https://www.adiressence.store/shop/checkout",
      requestOrigin: "https://adiressence-preview.vercel.app",
      vercelUrl: "adiressence-preview.vercel.app",
    }),
    "https://www.adiressence.store",
  );
});

test("Paystack references map to stable Sanity order identities", () => {
  const first = getPaystackOrderIdentity("PAY-TEST-123");
  const second = getPaystackOrderIdentity("PAY-TEST-123");

  assert.deepEqual(first, second);
  assert.match(first.orderId, /^order\.paystack\.[a-f0-9]{64}$/);
  assert.match(first.orderNumber, /^ORD-[A-F0-9]{12}$/);
  assert.throws(() => getPaystackOrderIdentity("invalid/reference"));
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
