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
    let isMounted = true
    let initTimeout: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          if (isMounted) {
            setAuthState({ user: null, loading: false, error: sessionError.message })
          }
          return
        }

        if (session?.user) {
          const appUser = await fetchAppUser(session.user.id)
          if (isMounted) {
            setAuthState({ user: appUser, loading: false, error: null })
          }
        } else {
          if (isMounted) {
            setAuthState({ user: null, loading: false, error: null })
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err)
        if (isMounted) {
          setAuthState({ user: null, loading: false, error: 'Authentication initialization failed' })
        }
      }
    }

    // Set timeout to ensure loading completes
    initTimeout = setTimeout(() => {
      if (isMounted) {
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }, 3000)

    initializeAuth()

    // Listen for auth changes - but don't let subscription errors block loading
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const appUser = await fetchAppUser(session.user.id)
            if (isMounted) {
              setAuthState({ user: appUser, loading: false, error: null })
            }
          } else {
            if (isMounted) {
              setAuthState({ user: null, loading: false, error: null })
            }
          }
        }
      )

      return () => {
        isMounted = false
        clearTimeout(initTimeout)
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    } catch (err) {
      console.error('Error setting up auth subscription:', err)
      clearTimeout(initTimeout)
      return () => {
        isMounted = false
        clearTimeout(initTimeout)
      }
    }
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
