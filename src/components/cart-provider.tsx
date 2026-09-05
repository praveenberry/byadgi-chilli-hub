"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { DemoProduct } from "@/lib/products";

type CartLine = DemoProduct & {
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  add: (
    product: DemoProduct,
    quantity?: number
  ) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  change: (
    id: string,
    quantity: number
  ) => void;
  clear: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartLine[]>(
    []
  );

  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "byadgi-demo-cart"
      );

      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(
        "byadgi-demo-cart"
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(
        "byadgi-demo-cart",
        JSON.stringify(items)
      );
    }
  }, [hydrated, items]);

  const value = useMemo(
    () => ({
      items,

      count: items.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      ),

      open,
      setOpen,

      add: (
        product: DemoProduct,
        quantity = 1
      ) => {
        setItems((current) => {
          const stock = Math.max(
            0,
            Number(product.stock) || 0
          );

          if (stock <= 0) {
            return current;
          }

          const line = current.find(
            (item) =>
              item.id === product.id
          );

          if (line) {
            const newQuantity = Math.min(
              line.quantity + quantity,
              stock
            );

            return current.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    quantity: newQuantity,
                  }
                : item
            );
          }

          return [
            ...current,
            {
              ...product,
              quantity: Math.min(
                quantity,
                stock
              ),
            },
          ];
        });

        setOpen(true);
      },

      change: (
        id: string,
        quantity: number
      ) =>
        setItems((current) =>
          quantity <= 0
            ? current.filter(
                (item) =>
                  item.id !== id
              )
            : current.map((item) => {
                if (item.id !== id) {
                  return item;
                }

                const stock = Math.max(
                  0,
                  Number(item.stock) || 0
                );

                return {
                  ...item,
                  quantity: Math.min(
                    quantity,
                    stock
                  ),
                };
              })
        ),

      clear: () => setItems([]),
    }),
    [items, open]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}