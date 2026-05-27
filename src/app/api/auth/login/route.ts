import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/bling";

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");

  try {
    const authUrl = getAuthUrl(state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("bling_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, baseUrl));
  }
}