import React, { useState, useEffect } from 'react'
import { getUsers, updateUserStatus, updateUserRole, countActiveAdmins } from '../lib/database'
import { AppUser, UserRole } from '../types/auth'

interface AdminPageProps {
  onBack: () => void
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAdminCount, setActiveAdminCount] = useState(0)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersData, adminCount] = await Promise.all([
        getUsers(),
        countActiveAdmins()
      ])
      setUsers(usersData)
      setActiveAdminCount(adminCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusToggle = async (user: AppUser) => {
    if (user.role === 'admin' && user.is_active && activeAdminCount <= 1) {
      alert('마지막 관리자는 비활성화할 수 없습니다.')
      return
    }

    try {
      await updateUserStatus(user.id, !user.is_active)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleRoleChange = async (user: AppUser, newRole: UserRole) => {
    if (user.role === 'admin' && newRole === 'user' && activeAdminCount <= 1 && user.is_active) {
      alert('마지막 관리자의 권한을 변경할 수 없습니다.')
      return
    }

    try {
      await updateUserRole(user.id, newRole)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← 돌아가기
            </button>
            <h1 className="text-xl font-bold text-slate-900">사용자 관리</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">전체 사용자 목록</h3>
            <p className="text-xs text-slate-500 mt-0.5">관리자 권한 및 계정 활성 상태 관리</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-slate-500 font-medium bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 w-64">이메일</th>
                  <th className="px-6 py-3 w-32">권한</th>
                  <th className="px-6 py-3 w-32">활성상태</th>
                  <th className="px-6 py-3 w-48">가입일</th>
                  <th className="px-6 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        disabled={user.role === 'admin' && activeAdminCount <= 1 && user.is_active}
                      >
                        <option value="user">사용자</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        user.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                        {user.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        disabled={user.role === 'admin' && activeAdminCount <= 1 && user.is_active}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          user.is_active
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        } ${
                          user.role === 'admin' && activeAdminCount <= 1 && user.is_active
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {user.is_active ? '비활성화' : '활성화'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
