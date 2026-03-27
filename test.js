const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '75x584bc',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
});

async function main() {
  const allDocs = await client.fetch('*[_type == "about"]{ _id, _updatedAt, title } | order(_updatedAt desc)');
  console.log("ALL ABOUT DOCS:", allDocs);
}

main().catch(console.error);
