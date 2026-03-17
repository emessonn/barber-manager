import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberManager - Gerenciamento de Barbearias",
  description: "SaaS Multi-tenant para gerenciamento de barbearias com agendamentos, finanças e CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-zinc-950 text-zinc-50">
          {children}
        </div>
      </body>
    </html>
  );
}
