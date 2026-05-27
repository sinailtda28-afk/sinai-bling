import { NextResponse } from "next/server";

export async function GET() {
  const response = new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sinai - Desconectado</title></head>
<body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
<h2>Desconectado</h2>
<p>Conexao com o Bling encerrada.</p>
<p><a href="/" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px">Voltar ao painel</a></p>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

  response.cookies.set("bling_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function POST() {
  return GET();
}