---
description: Create a new Sanity Schema
---

1.  **Ask the user** for the name of the schema (e.g., "blogPost", "product") and a brief description of the fields.
2.  **Create the schema file** in `sanity/schemaTypes/[name].ts` using the `defineType` helper.
    - Ensure the `name` property matches the filename (camelCase).
    - Add a `title`.
    - Define `fields` array with `defineField`.
3.  **Register the schema** in `sanity/schemaTypes/index.ts`.
    - Import the new schema.
    - Add it to the `types` array.
4.  **Verify**: creating a new file should automatically trigger a rebuild, but you can check `npm run dev` output for errors.
