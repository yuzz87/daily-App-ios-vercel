"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasSession } from "@/lib/auth";

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null);

  useEffect(() => {
    if (isPublicPath(pathname)) return;

    let cancelled = false;

    hasSession()
      .then((authenticated) => {
        if (cancelled) return;

        if (authenticated) {
          setAuthorizedPath(pathname);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isPublicPath(pathname)) return <>{children}</>;
  if (authorizedPath !== pathname) return null;
  return <>{children}</>;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/taskmemo" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/")
  );
}
