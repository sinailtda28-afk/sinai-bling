import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/bling";
import { encrypt } from "@/lib/crypto";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${protocol}://${host}`;
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = getBaseUrl(request);
  const domain = hostToDomain(baseUrl);

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(searchParams.get("error_description") || error)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=Codigo_de_autorizacao_ausente", baseUrl));
  }

  const savedState = request.cookies.get("bling_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/?error=Estado_invalido_possivel_CSRF", baseUrl));
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    const tokenPayload = JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      token_type: tokenData.token_type,
    });

    const encryptedToken = encrypt(tokenPayload);

    const response = NextResponse.redirect(new URL("/?connected=true", baseUrl));

    response.cookies.set("bling_token", encryptedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      domain,
    });

    response.cookies.set("bling_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      domain,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao autenticar";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, baseUrl));
  }
}