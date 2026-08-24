import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import {
  createCartLineId,
  type AlphaSize,
  type GarmentSizing,
} from "@/lib/sizing/garment-sizing";

// Types
export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
  sizing?: GarmentSizing;
  alphaSize?: AlphaSize;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface CartActions {
  addItem: (
    item: Omit<CartItem, "lineId" | "quantity">,
    quantity?: number,
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export type CartStore = CartState & CartActions;

// Default state
export const defaultInitState: CartState = {
  items: [],
  isOpen: false,
};

/**
 * Cart store factory - creates new store instance per provider
 * Uses persist middleware with skipHydration for Next.js SSR compatibility
 * @see https://zustand.docs.pmnd.rs/guides/nextjs#hydration-and-asynchronous-storages
 */
export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set) => ({
        ...initState,

        addItem: (item, quantity = 1) =>
          set((state) => {
            const lineId = createCartLineId(
              item.productId,
              item.sizing,
              item.alphaSize,
            );
            const existing = state.items.find(
              (i) => i.lineId === lineId,
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.lineId === lineId
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                ),
              };
            }
            return { items: [...state.items, { ...item, lineId, quantity }] };
          }),

        removeItem: (lineId) =>
          set((state) => ({
            items: state.items.filter((i) => i.lineId !== lineId),
          })),

        updateQuantity: (lineId, quantity) =>
          set((state) => {
            if (quantity <= 0) {
              return {
                items: state.items.filter((i) => i.lineId !== lineId),
              };
            }
            return {
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity } : i,
              ),
            };
          }),

        clearCart: () => set({ items: [] }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
      }),
      {
        name: "cart-storage",
        version: 2,
        migrate: (persistedState) => {
          const state = persistedState as Partial<CartState>;
          return {
            ...state,
            items: (state.items ?? []).map((item) => ({
              ...item,
              lineId:
                item.lineId ??
                createCartLineId(item.productId, item.sizing, item.alphaSize),
            })),
          } as CartState;
        },
        // Skip automatic hydration - we'll trigger it manually on the client
        skipHydration: true,
        // Only persist items, not UI state like isOpen
        partialize: (state) => ({ items: state.items }),
      }
    )
  );
};
