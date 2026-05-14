import { Suspense } from "react";
import CoffeeDetailContent from "./CoffeeDetailContent";

export default function CoffeeDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">読み込み中...</div>}>
      <CoffeeDetailContent />
    </Suspense>
  );
}
