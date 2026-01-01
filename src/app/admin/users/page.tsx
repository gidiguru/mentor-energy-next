'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, GraduationCap, Users as UsersIcon, Trash2, Loader2 } from 'lucide-react';

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'student' | 'mentor' | 'admin';
  discipline: string | null;
  university: string | null;
  createdAt: string;
}

const roleIcons = {
  student: GraduationCap,
  mentor: UsersIcon,
  admin: Shield,
};

const roleColors = {
  student: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  mentor: 'bg-green-500/10 text-green-600 dark:text-green-400',
  admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: 'student' | 'mentor' | 'admin') {
    setUpdatingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map((u) => (u.id === userId ? data.user : u)));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      alert('Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function deleteUser(userId: string) {
    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.discipline?.toLowerCase().includes(query) ||
      user.university?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-surface-500">Manage user roles and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card preset-filled-surface-50-950 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === 'student').length}
              </p>
              <p className="text-sm text-surface-500">Students</p>
            </div>
          </div>
        </div>
        <div className="card preset-filled-surface-50-950 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <UsersIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === 'mentor').length}
              </p>
              <p className="text-sm text-surface-500">Mentors</p>
            </div>
          </div>
        </div>
        <div className="card preset-filled-surface-50-950 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === 'admin').length}
              </p>
              <p className="text-sm text-surface-500">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Search users by name, email, discipline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="card preset-filled-surface-50-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-surface-200 dark:border-surface-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-500">
                  Discipline
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role];
                return (
                  <tr key={user.id} className="hover:bg-surface-100 dark:hover:bg-surface-800">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.university && (
                          <p className="text-sm text-surface-500">{user.university}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.discipline || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role]}`}
                      >
                        <RoleIcon className="h-3.5 w-3.5" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateRole(user.id, e.target.value as 'student' | 'mentor' | 'admin')
                          }
                          disabled={updatingUserId === user.id}
                          className="input py-1 text-sm"
                        >
                          <option value="student">Student</option>
                          <option value="mentor">Mentor</option>
                          <option value="admin">Admin</option>
                        </select>

                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteUser(user.id)}
                              disabled={deletingUserId === user.id}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              {deletingUserId === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-surface-200 dark:bg-surface-700 rounded hover:bg-surface-300 dark:hover:bg-surface-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-surface-500">
            No users found
          </div>
        )}
      </div>

      <p className="text-sm text-surface-500">
        Total: {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
