"use client";

import { useParams } from "next/navigation";
import EditCoffeeForm from "./EditCoffeeForm";

export function generateStaticParams() {
  return [];
}

export default function EditCoffeePage() {
  const params = useParams();
  const id = params.id as string;

  return <EditCoffeeForm coffeeBeanId={id} />;
}
