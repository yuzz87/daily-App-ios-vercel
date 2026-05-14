"use client";

import { useSearchParams } from "next/navigation";
import EditCoffeeForm from "../[id]/EditCoffeeForm";

export default function EditCoffeeContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  return <EditCoffeeForm coffeeBeanId={id} />;
}
