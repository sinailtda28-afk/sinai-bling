import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const homeUrl = `${proto}://${host}`;

  const response = NextResponse.redirect(new URL("/", homeUrl));

  response.cookies.set("bling_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}