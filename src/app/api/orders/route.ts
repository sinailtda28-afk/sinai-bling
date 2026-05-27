import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/crypto";
import { getRecentOrders, refreshAccessToken } from "@/lib/bling";

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get("bling_token")?.value;

  if (!tokenCookie) {
    return NextResponse.json({ connected: false, error: "Sem token" });
  }

  try {
    const decryptedToken = decrypt(tokenCookie);
    const tokenData = JSON.parse(decryptedToken);

    let accessToken = tokenData.access_token;
    let updatedToken = tokenData;

    if (Date.now() >= tokenData.expires_at) {
      try {
        const refreshed = await refreshAccessToken(tokenData.refresh_token);
        updatedToken = {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: Date.now() + refreshed.expires_in * 1000,
          token_type: refreshed.token_type,
        };
        accessToken = refreshed.access_token;
      } catch {
        return NextResponse.json({ connected: false, error: "Token expirado, reconecte" });
      }
    }

    try {
      const orders = await getRecentOrders(accessToken);

      const response = NextResponse.json({
        connected: true,
        orders,
      });

      const encryptedToken = encrypt(JSON.stringify(updatedToken));
      response.cookies.set("bling_token", encryptedToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    } catch {
      return NextResponse.json({ connected: false, error: "Falha ao buscar pedidos" });
    }
  } catch {
    return NextResponse.json({ connected: false, error: "Token invalido" });
  }
}