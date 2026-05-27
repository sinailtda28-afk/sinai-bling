"use client";

import { useEffect, useState, useCallback } from "react";

interface Order {
  id: number;
  numero: string;
  data: string;
  vlrtotal: number;
  situacao: string;
  contato: {
    nome: string;
  };
}

interface StatusData {
  connected: boolean;
  user?: unknown;
  orders?: Order[];
  error?: string;
}

const SITUACAO_MAP: Record<string, string> = {
  A: "Em aberto",
  B: "Baixado",
  C: "Cancelado",
  D: "Em digitacao",
  E: "Em analise",
  F: "Faturado",
  G: "Pronto entrega",
  H: "Entregue",
  I: "Inutilizado",
  J: "Rejeitado",
  K: "Confirmado",
  L: "Pendente",
  M: "Devolvido",
  N: "Em andamento",
  O: "Conferido",
  P: "Em producao",
  Q: "Aguardando producao",
  R: "Aguardando conferencia",
  S: "Remanif peach",
  T: "Em transito",
  U: "Em conferencia",
  V: "Conferido NF",
  W: "Aguardando NF",
  X: "Cancelado por motivo",
  Y: "Aguardando liberacao",
  Z: "Liberado",
};

function getSituacaoLabel(code: string): string {
  return SITUACAO_MAP[code] || code;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
        connected
          ? "bg-green-100 text-green-800 border border-green-300"
          : "bg-red-100 text-red-800 border border-red-300"
      }`}
    >
      <span
        className={`w-3 h-3 rounded-full ${
          connected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      {connected ? "Conectado ao Bling" : "Desconectado"}
    </span>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum pedido encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="pb-3 pr-4 font-medium">Numero</th>
            <th className="pb-3 pr-4 font-medium">Cliente</th>
            <th className="pb-3 pr-4 font-medium">Data</th>
            <th className="pb-3 pr-4 font-medium">Situacao</th>
            <th className="pb-3 font-medium text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 pr-4 font-mono text-blue-700">#{order.numero}</td>
              <td className="py-3 pr-4">{order.contato?.nome || "-"}</td>
              <td className="py-3 pr-4 text-gray-600">{formatDate(order.data)}</td>
              <td className="py-3 pr-4">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  order.situacao === "B" || order.situacao === "F"
                    ? "bg-green-50 text-green-700"
                    : order.situacao === "C"
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}>
                  {getSituacaoLabel(order.situacao)}
                </span>
              </td>
              <td className="py-3 text-right font-semibold text-green-700">
                {formatCurrency(order.vlrtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setStatus(data);
      setLastChecked(new Date());
      setError(null);
    } catch {
      setStatus({ connected: false, error: "Erro ao conectar com o servidor" });
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleConnect = () => {
    window.location.href = "/api/auth/login";
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/auth/disconnect", { method: "POST" });
      setStatus({ connected: false });
    } catch {
      setError("Erro ao desconectar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Verificando conexao...</p>
        </div>
      </div>
    );
  }

  const isConnected = status?.connected === true;
  const urlParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const justConnected = urlParams?.get("connected") === "true";
  const urlError = urlParams?.get("error");
  const displayError = error || urlError || status?.error;

  if (justConnected) {
    if (typeof window !== "undefined" && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sinai Multimarcas</h1>
              <p className="text-xs text-gray-500">Painel de Conexao Bling</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge connected={isConnected} />
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Conectar ao Bling
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Erro:</strong> {displayError}
          </div>
        )}

        {/* Success Alert */}
        {justConnected && !displayError && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Conexao com o Bling realizada com sucesso!
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isConnected ? "bg-green-100" : "bg-red-100"
              }`}>
                <span className={`text-lg ${isConnected ? "" : ""}`}>
                  {isConnected ? "✓" : "✕"}
                </span>
              </div>
              <h2 className="font-semibold text-gray-800">Status</h2>
            </div>
            <p className={`text-2xl font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isConnected ? "Online" : "Offline"}
            </p>
            {lastChecked && (
              <p className="text-xs text-gray-400 mt-1">
                Verificado: {lastChecked.toLocaleTimeString("pt-BR")}
              </p>
            )}
          </div>

          {/* Loja Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                🏪
              </div>
              <h2 className="font-semibold text-gray-800">Loja</h2>
            </div>
            <p className="text-lg font-bold text-gray-800">Sinai</p>
            <p className="text-xs text-gray-500 mt-1">Barra Mansa, RJ</p>
          </div>

          {/* Pedidos Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                📦
              </div>
              <h2 className="font-semibold text-gray-800">Pedidos</h2>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {status?.orders?.length ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">ultimos pedidos</p>
          </div>
        </div>

        {/* Orders Section */}
        {isConnected && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Pedidos Recentes
              </h2>
              <button
                onClick={checkStatus}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Atualizar
              </button>
            </div>
            <OrdersTable orders={status?.orders || []} />
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Desconectado do Bling
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Para ver seus pedidos e o status da conexao, clique no botao abaixo para
              conectar sua conta do Bling.
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
            >
              Conectar ao Bling
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-gray-400">
        Sinai Multimarcas &copy; {new Date().getFullYear()} - Painel Bling
      </footer>
    </div>
  );
}