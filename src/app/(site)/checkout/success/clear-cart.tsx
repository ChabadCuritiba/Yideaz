"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart";

export function ClearCart() {
  const { lines, clear } = useCart();
  useEffect(() => {
    if (lines.length) clear();
  }, [lines.length, clear]);
  return null;
}
