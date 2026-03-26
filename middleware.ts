import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const reservedPrefixes = ['/onboarding', '/admin', '/login', '/staff-login']
  const isPublicBookingOrPortal =
    /^\/[a-z0-9-]+(\/minha-conta(\/.*)?)?\/?\s*$/.test(pathname) &&
    !reservedPrefixes.some((p) => pathname.startsWith(p))

  if (isPublicBookingOrPortal) {
    return NextResponse.next()
  }

  // Staff login page - redirect to dashboard if already authenticated
  if (pathname === '/staff-login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (pathname === '/' || pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/onboarding')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
