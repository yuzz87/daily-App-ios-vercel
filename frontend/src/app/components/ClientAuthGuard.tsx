"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/auth";

const AUTH_BYPASS = process.env.NODE_ENV !== "production";

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(AUTH_BYPASS);

  useEffect(() => {
    if (AUTH_BYPASS) return;
    if (pathname === "/login") {
      setAuthorized(true);
      return;
    }
    if (!getToken()) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) return null;
  return <>{children}</>;
}
