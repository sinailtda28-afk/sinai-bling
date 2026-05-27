import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${protocol}://${host}`;
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  let domain: string | undefined;
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") domain = hostname;
  } catch {}

  const response = NextResponse.redirect(new URL("/", baseUrl));

  response.cookies.set("bling_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain,
  });

  return response;
}