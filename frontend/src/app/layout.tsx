import type { Metadata } from "next";
import { ClientAuthGuard } from "./components/ClientAuthGuard";
import Footer from "./components/Footer";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import { StopwatchProvider } from "./components/StopwatchProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Life App",
  description: "日常生活支援アプリ",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/PWA-Test-daily-v1/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="overflow-hidden">
        <ServiceWorkerRegistration />
        <StopwatchProvider>
          <ClientAuthGuard>
            <div className="flex h-screen flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden pb-20">{children}</div>
              <Footer />
            </div>
          </ClientAuthGuard>
        </StopwatchProvider>
      </body>
    </html>
  );
}
