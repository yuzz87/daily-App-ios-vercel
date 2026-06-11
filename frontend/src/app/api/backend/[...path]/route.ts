import { NextRequest, NextResponse } from "next/server";
import {
  authorizationHeader,
  backendApiBaseUrl,
  backendOrigin,
  clearAuthCookie,
  getAuthToken,
  invalidOriginResponse,
  isMutatingMethod,
  isSameOriginRequest,
} from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const FORWARDED_RESPONSE_HEADERS = new Set([
  "cache-control",
  "content-disposition",
  "content-length",
  "content-type",
  "etag",
  "last-modified",
]);

async function proxyToBackend(request: NextRequest, context: RouteContext) {
  if (isMutatingMethod(request.method) && !isSameOriginRequest(request)) {
    return invalidOriginResponse();
  }

  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);
  const headers = new Headers({
    Authorization: authorizationHeader(token),
    Accept: request.headers.get("accept") ?? "application/json",
  });

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (FORWARDED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("Cache-Control", "no-store");

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  if (backendResponse.status === 401) {
    clearAuthCookie(response);
  }

  return response;
}

function buildTargetUrl(path: string[], search: string): string {
  const encodedPath = path.map(encodeURIComponent).join("/");

  if (path[0] === "uploads") {
    return `${backendOrigin()}/${encodedPath}${search}`;
  }

  return `${backendApiBaseUrl()}/${encodedPath}${search}`;
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}

export function HEAD(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context);
}
