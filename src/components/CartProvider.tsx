"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartItem } from "@/lib/types";

const STORAGE_KEY = "guedias-cart-v1";

interface AddItemInput {
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  material: string;
  personalization?: string;
  profile: number[];
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (input: AddItemInput) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  totalQty: number;
  subtotal: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(productId: string, color: string, material: string, personalization?: string) {
  return [productId, color, material, personalization ?? ""].join("::");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    const key = makeKey(input.productId, input.color, input.material, input.personalization);
    setItems((prev) => {
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) =>
          it.key === key ? { ...it, qty: it.qty + input.qty } : it
        );
      }
      return [
        ...prev,
        {
          key,
          productId: input.productId,
          slug: input.slug,
          name: input.name,
          price: input.price,
          color: input.color,
          material: input.material,
          personalization: input.personalization,
          profile: input.profile,
          qty: input.qty,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key ? { ...it, qty: Math.max(1, Math.min(qty, 20)) } : it
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQty = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.qty * it.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clear, totalQty, subtotal, isHydrated }),
    [items, addItem, removeItem, updateQty, clear, totalQty, subtotal, isHydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
