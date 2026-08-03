
import { faker } from '@faker-js/faker';

// Arrays to hold IDs for references
const categoryIds = [];
const customerIds = [];
const productIds = [];

// Helper to print NDJSON line
const emit = (doc) => console.log(JSON.stringify(doc));

// Constants
const MATERIALS = ["Leather", "Fabric", "Wood", "Metal", "Glass"];
const COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Brown", "Grey"];
const STATUSES = ["paid", "shipped", "delivered", "cancelled"];

// 1. Categories
const CATEGORY_COUNT = 5;
for (let i = 0; i < CATEGORY_COUNT; i++) {
  const catId = faker.string.uuid();
  categoryIds.push(catId);
  const title = faker.commerce.department();
  
  emit({
    _id: catId,
    _type: 'category',
    title: title,
    slug: { _type: 'slug', current: faker.helpers.slugify(title).toLowerCase() },
  });
}

// 2. Customers
const CUSTOMER_COUNT = 10;
for (let i = 0; i < CUSTOMER_COUNT; i++) {
  const custId = faker.string.uuid();
  customerIds.push(custId);
  
  emit({
    _id: custId,
    _type: 'customer',
    name: faker.person.fullName(),
    email: faker.internet.email(),
    clerkUserId: `user_${faker.string.alphanumeric(10)}`,
    paystackCustomerCode: `CUS_${faker.string.alphanumeric(10)}`,
    createdAt: faker.date.past().toISOString(),
  });
}

// 3. Products
const PRODUCT_COUNT = 20;
for (let i = 0; i < PRODUCT_COUNT; i++) {
  const prodId = faker.string.uuid();
  productIds.push(prodId);
  const name = faker.commerce.productName();
  
  emit({
    _id: prodId,
    _type: 'product',
    name: name,
    slug: { _type: 'slug', current: faker.helpers.slugify(name).toLowerCase() },
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
    category: {
      _type: 'reference',
      _ref: faker.helpers.arrayElement(categoryIds)
    },
    stock: faker.number.int({ min: 0, max: 100 }),
    featured: faker.datatype.boolean(),
    images: [], 
    material: faker.helpers.arrayElement(MATERIALS),
    color: faker.helpers.arrayElement(COLORS),
    dimensions: `${faker.number.int({min: 10, max:200})}cm x ${faker.number.int({min: 10, max:200})}cm`,
    assemblyRequired: faker.datatype.boolean(),
  });
}

// 4. Orders
const ORDER_COUNT = 15;
for (let i = 0; i < ORDER_COUNT; i++) {
  const orderId = faker.string.uuid();
  const customerRef = faker.helpers.arrayElement(customerIds);
  // items
  const itemCount = faker.number.int({ min: 1, max: 4 });
  const items = [];
  let total = 0;

  for (let j = 0; j < itemCount; j++) {
    const prodRef = faker.helpers.arrayElement(productIds);
    const qty = faker.number.int({ min: 1, max: 3 });
    const price = parseFloat(faker.commerce.price({ min: 10, max: 200 })); 
    total += price * qty;

    items.push({
      _key: faker.string.uuid(),
      product: { _type: 'reference', _ref: prodRef },
      quantity: qty,
      priceAtPurchase: price
    });
  }

  emit({
    _id: orderId,
    _type: 'order',
    orderNumber: faker.string.alphanumeric(8).toUpperCase(),
    items: items,
    total: total,
    status: faker.helpers.arrayElement(STATUSES),
    customer: { _type: 'reference', _ref: customerRef },
    email: faker.internet.email(),
    createdAt: faker.date.past().toISOString(),
  });
}
