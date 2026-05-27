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

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Conectando ao Bling...</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<h2>Sinai Multimarcas</h2>
<p>Redirecionando para o Bling...</p>
<noscript>
<p style="color:red"><b>JavaScript desabilitado.</b> Use o link abaixo:</p>
</noscript>
<p style="margin-top:20px"><a href="${authUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-size:16px">Conectar ao Bling</a></p>
<script>
setTimeout(function() {
  window.location.href = "${authUrl}";
}, 500);
</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  response.cookies.set("bling_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}