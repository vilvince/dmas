import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets (images, fonts, etc.) to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For all other routes, you may add authentication later, but for now just allow.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}