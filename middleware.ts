import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const middleware = auth(async (req: NextRequest) => {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ["/", "/login", "/api/auth"];

  // Se é uma rota de agendamento público (ex: /premium-barbershop)
  const isPublicBooking = pathname.match(/^\/[a-z0-9\-]+\/?$|^\/[a-z0-9\-]+\/\//);

  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    isPublicBooking
  ) {
    return NextResponse.next();
  }

  // Rotas privadas (/admin) requerem autenticação
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Validar se o usuário é ADMIN
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
