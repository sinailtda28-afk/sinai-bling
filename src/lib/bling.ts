export const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";
export const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
export const BLING_API_URL = "https://www.bling.com.br/Api/v3";

export function getAuthUrl(state: string): string {
  const clientId = process.env.BLING_CLIENT_ID;
  const callbackUrl = process.env.BLING_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    throw new Error("BLING_CLIENT_ID ou BLING_CALLBACK_URL nao configurados");
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    state,
  });
  return `${BLING_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}> {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  const callbackUrl = process.env.BLING_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("Variaveis de ambiente do Bling nao configuradas");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao trocar codigo por token: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}> {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Variaveis de ambiente do Bling nao configuradas");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao refresh token: ${response.status} - ${errorText}`);
  }

  return response.json();
}

interface BlingPedido {
  id: number;
  numero: string;
  data: string;
  vlrtotal: number;
  situacao: string;
  contato: {
    nome: string;
  };
}

interface BlingResponse {
  data: BlingPedido[];
}

export async function getRecentOrders(accessToken: string): Promise<BlingPedido[]> {
  const response = await fetch(`${BLING_API_URL}/pedidos/vendas?limit=10&order=data.desc`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar pedidos: ${response.status}`);
  }

  const data: BlingResponse = await response.json();
  return data.data || [];
}

export async function getUserInfo(accessToken: string): Promise<unknown> {
  const response = await fetch(`${BLING_API_URL}/usuario`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar info do usuario: ${response.status}`);
  }

  return response.json();
}