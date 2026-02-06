import React, { ReactNode } from 'react'
import { useAuthContext } from './AuthProvider'
import { LoginPage } from './LoginPage'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

function PendingApprovalPage() {
  const { signOut, user } = useAuthContext()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">승인 대기 중</h1>
        <p className="text-slate-500 mb-6">
          계정이 아직 활성화되지 않았습니다.<br />
          관리자의 승인을 기다려 주세요.
        </p>
        <p className="text-sm text-slate-400 mb-4">
          로그인 계정: {user?.email}
        </p>
        <button
          onClick={signOut}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  )
}

function AccessDeniedPage() {
  const { signOut } = useAuthContext()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">접근 권한 없음</h1>
        <p className="text-slate-500 mb-6">
          이 페이지에 접근할 권한이 없습니다.<br />
          관리자 권한이 필요합니다.
        </p>
        <button
          onClick={signOut}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">로딩 중...</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isActive } = useAuthContext()

  if (loading) {
    return <LoadingPage />
  }

  if (!user) {
    return <LoginPage />
  }

  if (!isActive) {
    return <PendingApprovalPage />
  }

  if (requireAdmin && !isAdmin) {
    return <AccessDeniedPage />
  }

  return <>{children}</>
}
