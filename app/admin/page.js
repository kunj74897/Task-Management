import { getTaskStats } from '@/app/actions/taskActions';
import { getUsers } from '@/app/actions/userActions';
import Link from 'next/link';
import RecentTasks from './components/RecentTasks';
import UserTaskDistribution from './components/UserTaskDistribution';
import DashboardCard from './components/DashboardCard';

export default async function AdminDashboard() {
  const stats = await getTaskStats();
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Tasks"
          value={stats.total}
          icon="📋"
          href="/admin/tasks"
        />
        <DashboardCard
          title="Pending Tasks"
          value={stats.pending}
          icon="⏳"
          color="yellow"
        />
        <DashboardCard
          title="Completed Tasks"
          value={stats.completed}
          icon="✅"
          color="green"
        />
        <DashboardCard
          title="Total Users"
          value={users.length}
          icon="👥"
          href="/admin/users"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTasks />
        <UserTaskDistribution users={users} />
      </div>
    </div>
  );
}
