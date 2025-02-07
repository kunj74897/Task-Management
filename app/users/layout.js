import LogoutButton from '@/app/components/LogoutButton';
import NotificationButton from '@/app/users/components/NotificationButton';
import { getCurrentUser } from '@/app/actions/authActions';

export default async function UserLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LogoutButton />
              <NotificationButton userId={user?.id} />
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6">
        {children}
      </main>
    </div>
  );
} 