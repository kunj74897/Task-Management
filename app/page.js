import LoginForm from './components/LoginForm';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import LoadingScreen from './components/LoadingScreen';
import { headers } from 'next/headers';

export default async function Home() {
  // Check if we're already processing a redirect
  const headersList =await  headers();
  const isRedirecting = headersList.get('x-middleware-rewrite');
  
  if (!isRedirecting) {
    try {
      const cookieStore =await cookies();
      const token = cookieStore.get('token');

      if (token) {
        const decoded = verify(token.value, process.env.JWT_SECRET);
        // Instead of redirecting, we'll return null and let middleware handle it
        return null;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }

  // Show login form if no token or verification failed
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoginForm />
    </div>
  );
}
