'use client';

export default function UserTaskDistribution({ users }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">User Task Distribution</h2>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                <span className="text-sm font-medium">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{user.username}</span>
            </div>
            <span className="text-sm text-gray-500">{user.taskCount || 0} tasks</span>
          </div>
        ))}
      </div>
    </div>
  );
} 