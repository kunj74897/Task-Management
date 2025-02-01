import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  console.log('Middleware - Requested URL:', request.nextUrl.pathname);
  
  // Allow access to auth-related routes without token
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token');
  console.log('Middleware - Token exists:', !!token);

  try {
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token.value, secret);
      console.log('Middleware - Decoded token:', payload);
      
      // Check role-based access
      if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'admin') {
        console.log('Middleware - Unauthorized admin access, redirecting to /users');
        return NextResponse.redirect(new URL('/users', request.url));
      }

      if (request.nextUrl.pathname.startsWith('/users') && payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Middleware - Token verification failed:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/users/:path*',
  ],
};