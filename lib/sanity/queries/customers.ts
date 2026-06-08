import { defineQuery } from "next-sanity";

export const CUSTOMER_BY_EMAIL_QUERY = defineQuery(`*[
  _type == "customer"
  && email == $email
][0]{
  _id,
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  paystackCustomerCode,
  createdAt
}`);

export const CUSTOMER_BY_STRIPE_ID_QUERY = defineQuery(`*[
  _type == "customer"
  && stripeCustomerId == $stripeCustomerId
][0]{
  _id,
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  paystackCustomerCode,
  createdAt
}`);

export const CUSTOMER_BY_PAYSTACK_CODE_QUERY = defineQuery(`*[
  _type == "customer"
  && paystackCustomerCode == $paystackCustomerCode
][0]{
  _id,
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  paystackCustomerCode,
  createdAt
}`);
