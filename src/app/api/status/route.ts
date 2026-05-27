import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { getUserInfo, refreshAccessToken } from "@/lib/bling";
import { encrypt } from "@/lib/crypto";

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
      const userInfo = await getUserInfo(accessToken);

      const response = NextResponse.json({
        connected: true,
        user: userInfo,
      });

      const encryptedToken = encrypt(JSON.stringify(updatedToken));
      let domain: string | undefined;
      try {
        const host = request.headers.get("host") || "";
        const hostname = host.split(":")[0];
        if (hostname !== "localhost" && hostname !== "127.0.0.1") domain = hostname;
      } catch {}
      response.cookies.set("bling_token", encryptedToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        domain,
      });

      return response;
    } catch {
      return NextResponse.json({ connected: false, error: "Falha ao verificar conexao" });
    }
  } catch {
    return NextResponse.json({ connected: false, error: "Token invalido" });
  }
}