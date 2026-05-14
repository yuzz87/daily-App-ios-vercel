"use client";

import { useSearchParams } from "next/navigation";
import CoffeeDetailClient from "../[id]/CoffeeDetailClient";

export default function CoffeeDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  return <CoffeeDetailClient id={id} />;
}
