import LoginForm from './components/LoginForm';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export default async function Home() {
  

  // If no token or invalid token, show login form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoginForm />
    </div>
  );
}
