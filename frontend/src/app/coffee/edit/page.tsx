import { Suspense } from "react";
import EditCoffeeContent from "./EditCoffeeContent";

export default function EditCoffeePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">読み込み中...</div>}>
      <EditCoffeeContent />
    </Suspense>
  );
}
