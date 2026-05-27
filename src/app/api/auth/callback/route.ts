import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/bling";
import { encrypt } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return errorPage(`Bling rejeitou a autorizacao: ${searchParams.get("error_description") || error}`);
  }

  if (!code || !state) {
    return errorPage("Codigo de autorizacao ausente. Tente conectar novamente.");
  }

  const savedState = request.cookies.get("bling_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return errorPage("Estado invalido (possivel CSRF). Tente conectar novamente.");
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

    const response = new NextResponse(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

    response.cookies.set("bling_token", encryptedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    response.cookies.set("bling_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao autenticar";
    return errorPage(message);
  }
}

function errorPage(message: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sinai - Erro</title></head>
<body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
<h2 style="color:#dc2626">Erro de conexao</h2>
<p>${message}</p>
<p><a href="/" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;margin-top:20px">Voltar ao painel</a></p>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

const successHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sinai - Conectado!</title></head>
<body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
<h2 style="color:#16a34a">Conectado com sucesso!</h2>
<p>Conexao com o Bling realizada.</p>
<div style="margin-top:20px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
Ja deve redirecionar automaticamente em <span id="countdown">3</span> segundos...
</div>
<p style="margin-top:10px"><a href="/" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-size:16px">Ir para o painel</a></p>
<script>
let seconds = 3;
var el = document.getElementById("countdown");
if (el) {
  var interval = setInterval(function() {
    seconds--;
    if (seconds <= 0) {
      clearInterval(interval);
      window.location.href = "/";
    } else {
      el.textContent = seconds;
    }
  }, 1000);
}
</script>
</body>
</html>`;