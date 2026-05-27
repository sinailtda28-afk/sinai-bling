import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinai Multimarcas - Painel Bling",
  description: "Painel de status de conexao com o Bling - Sinai Multimarcas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}