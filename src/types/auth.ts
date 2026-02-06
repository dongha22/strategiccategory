export type UserRole = 'admin' | 'user'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AppUser | null
  loading: boolean
  error: string | null
}
