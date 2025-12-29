---
description: Add a new Zustand Slice
---

1.  **Ask the user** what state needs to be managed (e.g., "cart", "userSettings").
2.  **Identify the store location**. Check `lib/store.ts` or `hooks/use-store.ts`.
3.  **Define the Slice Interface**. Create an interface for the State and Actions (e.g., `CartState`, `CartActions`).
4.  **Create the Slice Creator**. Define a function `create[Name]Slice` that returns the initial state and actions.
5.  **Integrate into Main Store**. Update the main store creation function (e.g., `useStore`) to include the new slice using the `...` spread syntax.
6.  **Verify**: Ensure no type errors exist in the store file.
