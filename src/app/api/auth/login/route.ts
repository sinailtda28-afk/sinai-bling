import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/bling";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  let authUrl: string;

  try {
    authUrl = getAuthUrl(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Sinai</title><meta charset="utf-8"></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Erro</h2><p>${message}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const response = new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Conectando ao Bling...</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<h2>Sinai Multimarcas</h2>
<p>Redirecionando para o Bling...</p>
<p style="margin-top:20px">Se nao redirecionar automaticamente:</p>
<a href="${authUrl.replace(/"/g, '&quot;')}" style="color:blue">Clique aqui para conectar ao Bling</a>
<script>window.location.href="${authUrl.replace(/"/g, '\\"')}"</script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": `bling_oauth_state=${state}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`,
      },
    }
  );

  return response;
}