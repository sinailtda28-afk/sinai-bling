import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/bling";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${protocol}://${host}`;
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");
  const baseUrl = getBaseUrl(request);

  try {
    const authUrl = getAuthUrl(state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("bling_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
      domain: hostToDomain(baseUrl),
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, baseUrl));
  }
}

function hostToDomain(baseUrl: string): string | undefined {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
    return hostname;
  } catch {
    return undefined;
  }
}