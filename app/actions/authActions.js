'use server'

import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie?.value) {
      return null;
    }

    const decoded = verify(tokenCookie.value, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    return {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function getAuthToken() {
  const cookieStore = awaitcookies();
  const token =  cookieStore.get('token');
  return token?.value || null;
} 