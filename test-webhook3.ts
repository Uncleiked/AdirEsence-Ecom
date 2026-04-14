import { client } from "./sanity/lib/client";
async function get() {
  const products = await client.fetch(`*[_type=="product"][0]{_id}`);
  console.log("Found product:", products?._id);
}
get();
