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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Dashboard
        </h1>
        <NotificationButton userId={user.id} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <DashboardCard
          title="Pending Tasks"
          value={stats.pending}
          icon="⏳"
          color="yellow"
          href="/users/tasks?status=pending"
        />
        <DashboardCard
          title="In Progress"
          value={stats.inProgress}
          icon="🔄"
          color="blue"
          href="/users/tasks?status=in-progress"
        />
        <DashboardCard
          title="Completed Tasks"
          value={stats.completed}
          icon="✅"
          color="green"
          href="/users/tasks?status=completed"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
        <UserTaskList />
      </div>
    </div>
  );
}