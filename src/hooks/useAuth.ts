import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AppUser, AuthState } from '../types/auth'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const fetchAppUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching app user:', error)
      return null
    }
    return data as AppUser
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchAppUser(session.user.id)
        setAuthState({ user: appUser, loading: false, error: null })
      } else {
        setAuthState({ user: null, loading: false, error: null })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const appUser = await fetchAppUser(session.user.id)
          setAuthState({ user: appUser, loading: false, error: null })
        } else {
          setAuthState({ user: null, loading: false, error: null })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchAppUser])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }))
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }))
    }
  }, [])

  const isAdmin = authState.user?.role === 'admin'
  const isActive = authState.user?.is_active ?? false

  return {
    ...authState,
    signInWithGoogle,
    signOut,
    isAdmin,
    isActive,
  }
}
