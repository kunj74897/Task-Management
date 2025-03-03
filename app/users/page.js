import { getTaskStats } from '@/app/actions/userTaskActions';
import DashboardCard from '@/app/admin/components/DashboardCard';
import UserTaskList from '@/app/users/components/UserTaskList';
import NotificationButton from '@/app/users/components/NotificationButton';
import { getCurrentUser } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';

export default async function UserDashboard() {
  const user = await getCurrentUser();
  const stats = await getTaskStats(user?.id);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.username}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s an overview of your tasks and activities
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="Tasks to Do"
            value={stats.pending}
            icon="⏳"
            color="yellow"
            trend={stats.pendingTrend}
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800"
          />
          <DashboardCard
            title="In Progress"
            value={stats.inProgress}
            icon="🔄"
            color="blue"
            trend={stats.inProgressTrend}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
          />
          <DashboardCard
            title="Completed"
            value={stats.completed}
            icon="✅"
            color="green"
            trend={stats.completedTrend}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <UserTaskList />
        </div>
      </div>
    </div>
  );
}