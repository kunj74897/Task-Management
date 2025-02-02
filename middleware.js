import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token');

  try {
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token.value, secret);
      
      // Handle root path redirect
      if (request.nextUrl.pathname === '/') {
        const redirectUrl = payload.role === 'admin' ? '/admin' : '/users';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      // Check role-based access for other paths
      if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/users', request.url));
      }

      if (request.nextUrl.pathname.startsWith('/users') && payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      return NextResponse.next();
    }

    // Allow access to root path without token
    if (request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Middleware - Token verification failed:', error);
    
    // Allow access to root path if token verification fails
    if (request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};