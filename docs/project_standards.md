# Antigravity Project Standards

This document serves as the central source of truth for "Rules" and best practices for the `adiressence-ecom` project. All AI agents (Antigravity) and developers should adhere to these standards.

## 1. Sanity CMS

**Goal**: Valid, type-safe, and organized content schemas.

- **Schema Location**: All schemas must reside in `sanity/schemaTypes`.
- **Registration**: New schemas must be exported in `sanity/schemaTypes/index.ts` and added to the `types` array.
- **Helpers**: Always use `defineType` and `defineField` from `sanity` for better type inference.
- **Naming**:
  - File names: `camelCase.ts` (e.g., `blogPost.ts`).
  - Type names: `camelCase` (e.g., `blogPost`).
  - Titles: Title Case (e.g., "Blog Post").
- **Fields**:
  - Always provide a `title` for fields.
  - Use `validation` rules where appropriate (e.g., `rule => rule.required()`).

## 2. Zustand (State Management)

**Goal**: Predictable global state with minimal boilerplate.

- **Location**: Store files in `lib/store` or `hooks/use-store.ts`.
- **Pattern**: Use the "Slices" pattern for complex state.
- **Type Safety**: Always define a `State` interface and an `Actions` interface.
- **Persistence**: Use `persist` middleware only for user preferences or cart data, not for derived UI state.
- **Selectors**: Use atomic selectors when consuming state to minimize re-renders.

## 3. Shadcn UI

**Goal**: Consistent, accessible, and beautiful UI components.

- **Installation**: Use the CLI `npx shadcn@latest add [component]` or the Antigravity workflow.
- **Customization**: Modify components directly in `components/ui`. these are your components, not a library.
- **CN Utility**: Always use `cn()` (from `lib/utils`) for merging class names.
  - Example: `className={cn("bg-primary text-primary-foreground", className)}`
- **Icons**: Use `lucide-react` for icons.

## 4. Clerk (Authentication)

**Goal**: Secure and seamless user identity management.

- **Middleware**: Ensure public routes are explicitly defined in `middleware.ts` using `createRouteMatcher`.
- **Components**: Prefer Clerk's pre-built components (`<SignIn />`, `<UserButton />`) for standard flows.
- **Hooks**: Use `useUser()` for client-side user data and `auth()` (server-side) for protected API routes.

## 5. Paystack & Stripe (Payments)

**Goal**: Secure, reliable payment processing.

- **Security**: NEVER expose secret keys in client-side code. Use server actions or API routes.
- **Webhooks**:
  - Handle webhooks in `app/api/webhooks/[provider]/route.ts`.
  - Verify webhook signatures before processing events.
- **Idempotency**: Ensure webhook handlers are idempotent (can handle the same event multiple times without error).
- **Environment**: strict separation of Live and Test keys in `.env.local`.

## 6. General Coding Standards

- **TypeScript**: properties should be strictly typed. Avoid `any`.
- **Server Actions**: Prefer Server Actions (in `app/actions` or next to components) over API routes for form submissions.
- **Directory Structure**:
  - `app/(app)/`: Main application routes (marketing, dashboard).
  - `components/ui`: Shadcn primitives.
  - `components/shared`: Reusable project-specific components.
  - `lib/`: Utilities, helpers, and types.
