import { writeClient } from "./sanity/lib/client";

async function run() {
  try {
    console.log("Decreasing stock...");
    await writeClient.transaction()
      .patch("product-arc-floor-lamp", (p) => p.dec({ stock: 1 }))
      .commit();
    console.log("Stock decreased successfully");
  } catch (e: any) {
    console.error("Error decreasing stock:", e.message);
  }
}
run();
