import { client } from "./client";
import { groq } from "next-sanity";

// --- DASHBOARD QUERIES ---

export async function getDashboardStats() {
  const query = groq`{
    "totalRevenue": math::sum(*[_type == "order" && status != "cancelled"].total),
    "totalOrders": count(*[_type == "order"]),
    "newCustomers": count(*[_type == "customer"]),
    "returnRate": 0, // Placeholder, implement actual logic if needed
    "totalProducts": count(*[_type == "product"]),
    "lowStockProducts": count(*[_type == "product" && stock <= 5])
  }`;
  return client.fetch(query);
}

export async function getRecentOrders(limit = 5) {
  const query = groq`*[_type == "order"] | order(createdAt desc)[0...$limit] {
    _id,
    orderNumber,
    "customer": customer->{
      "name": address.name,
      email
    },
    total,
    status,
    createdAt
  }`;
  return client.fetch(query, { limit });
}

export async function getLowStockProducts(limit = 5) {
  const query = groq`*[_type == "product" && stock <= 5] | order(stock asc)[0...$limit] {
    _id,
    name,
    stock,
    "image": images[0]{
      asset->{
        url
      }
    }
  }`;
  return client.fetch(query, { limit });
}

// --- PRODUCTS QUERIES ---

export async function getAllProducts() {
  const query = groq`*[_type == "product"] | order(_createdAt desc) {
    _id,
    name,
    price,
    stock,
    featured,
    "image": images[0]{
      asset->{
        url
      }
    }
  }`;
  return client.fetch(query);
}

export async function getProductById(id: string) {
  const query = groq`*[_type == "product" && _id == $id][0] {
    _id,
    name,
    description,
    price,
    stock,
    featured,
    material,
    color,
    dimensions,
    assemblyRequired,
    "category": category->{
      _id,
      title
    },
    images[]{
      asset->{
        url
      }
    }
  }`;
  return client.fetch(query, { id });
}

// --- ORDERS QUERIES ---

export async function getAllOrders() {
  const query = groq`*[_type == "order"] | order(createdAt desc) {
    _id,
    orderNumber,
    "customer": customer->{
      "name": address.name,
      email
    },
    total,
    status,
    createdAt
  }`;
  return client.fetch(query);
}

export async function getOrderById(id: string) {
  const query = groq`*[_type == "order" && _id == $id][0] {
    _id,
    orderNumber,
    total,
    status,
    createdAt,
    "customer": customer->{
      _id,
      email,
      clerkUserId,
      address
    },
    items[]{
      quantity,
      priceAtPurchase,
      "product": product->{
        _id,
        name,
        "image": images[0]{
          asset->{
            url
          }
        }
      }
    }
  }`;
  return client.fetch(query, { id });
}
