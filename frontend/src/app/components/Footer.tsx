"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicUrl } from "@/lib/publicPath";

const footerLinks = [
  {
    href: "/calendar",
    label: "カレンダー",
    icon: "/calendar-heart.svg",
  },
  {
    href: "/taskmemo",
    label: "メモ",
    icon: "/notebook-pen.svg",
  },
  {
    href: "/coffee",
    label: "コーヒー",
    icon: "/coffee.svg",
  },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <nav
        aria-label="フッターナビゲーション"
        className="mx-auto grid max-w-3xl grid-cols-3 px-2 py-2"
      >
        {footerLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs transition ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Image
                src={publicUrl(link.icon)}
                alt=""
                width={24}
                height={24}
                className={isActive ? "opacity-100" : "opacity-70"}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
