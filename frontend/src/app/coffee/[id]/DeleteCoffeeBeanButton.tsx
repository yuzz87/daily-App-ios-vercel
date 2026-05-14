"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/auth";

type DeleteCoffeeBeanButtonProps = {
  coffeeBeanId: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DeleteCoffeeBeanButton({
  coffeeBeanId,
}: DeleteCoffeeBeanButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (!API_BASE_URL) {
      setErrorMessage("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this coffee bean? Tasting notes for this bean will also be deleted."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/coffee_beans/${coffeeBeanId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setErrorMessage("Failed to delete the coffee bean.");
        return;
      }

      router.push("/coffee");
      router.refresh();
    } catch {
      setErrorMessage("Could not connect to the Rails API.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-500"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {errorMessage ? (
        <p role="alert" className="max-w-64 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
