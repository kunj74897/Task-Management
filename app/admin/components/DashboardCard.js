import Link from 'next/link';

export default function DashboardCard({ title, value, icon, color = 'blue', href }) {
  const Card = href ? Link : 'div';
  
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    green: 'bg-green-50 dark:bg-green-900/20'
  };
  
  return (
    <Card
      href={href}
      className={`${colorClasses[color]} rounded-lg shadow-sm p-6 
        ${href ? 'hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </Card>
  );
} 