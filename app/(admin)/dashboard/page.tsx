import { auth } from "@/lib/auth";
import { prismaClient } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateBR } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user.id) {
    return <div>Não autorizado</div>;
  }

  // Buscar usuário para obter barbershop_id
  const user = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.barbershop_id) {
    return <div>Barbearia não encontrada</div>;
  }

  const barbershop_id = user.barbershop_id;

  // Buscar métricas
  const [
    totalRevenue,
    totalCommissions,
    todayBookings,
    totalClients,
    recentBookings,
  ] = await Promise.all([
    prismaClient.financialRecord.aggregate({
      where: {
        barbershop_id,
        type: "ENTRADA",
        created_at: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      _sum: { amount: true },
    }),
    prismaClient.commission.aggregate({
      where: {
        barbershop_id,
        computed_at: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      _sum: { amount: true },
    }),
    prismaClient.booking.count({
      where: {
        barber: { barbershop_id },
        date_time: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prismaClient.client.count({
      where: { barbershop_id },
    }),
    prismaClient.booking.findMany({
      where: { barber: { barbershop_id } },
      include: { barber: true, service: true, client: true },
      orderBy: { created_at: "desc" },
      take: 5,
    }),
  ]);

  const revenue = totalRevenue._sum.amount || 0;
  const commissions = totalCommissions._sum.amount || 0;

  return (
    <div className="space-y-8 p-8 md:p-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400">Bem-vindo de volta! Aqui está seu resumo.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento (Ano)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(revenue)}</p>
            <p className="text-xs text-zinc-500">Total de entradas</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões (Ano)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(commissions)}</p>
            <p className="text-xs text-zinc-500">Total de comissões</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayBookings}</p>
            <p className="text-xs text-zinc-500">Confirmados</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClients}</p>
            <p className="text-xs text-zinc-500">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="border-zinc-700 bg-zinc-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <span>Agendamentos Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{booking.client.name}</p>
                    <p className="text-sm text-zinc-400">
                      {booking.service.name} - {booking.barber.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDateBR(booking.date_time)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(booking.service.price)}
                    </p>
                    <span className="text-xs rounded-full bg-amber-600/20 text-amber-600 px-2 py-1">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">Nenhum agendamento encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
