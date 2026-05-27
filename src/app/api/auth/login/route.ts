import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/bling";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  try {
    const authUrl = getAuthUrl(state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("bling_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }
}