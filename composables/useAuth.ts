import type { Database } from '~/types/database.types'

interface AuthForm {
  email: string
  password: string
  username?: string
  fullName?: string
}

export const useAuth = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()

  const generateUsername = (email: string, fullName?: string) => {
    const base = fullName
      ? fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
      : email.split('@')[0]

    const timestamp = Date.now().toString().slice(-4)
    return `${base}${timestamp}`
  }

  const signUp = async (form: AuthForm) => {
    if (!form.username && !form.fullName) {
      throw new Error('Username or full name is required')
    }

    const username = form.username || generateUsername(form.email, form.fullName)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      throw new Error(authError.message)
    }
  }

  const signIn = async (form: Pick<AuthForm, 'email' | 'password'>) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const signInWithGoogle = async () => {
    const config = useAppConfig()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/confirm',
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error('OAuth redirect URL not provided. Please check Supabase OAuth configuration.')
    }
  }

  const signOut = async () => {
    alert('signing out')
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  const handleGoogleCallback = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error('Failed to get session from Google authentication')
    }

    if (!data.session) {
      throw new Error('No session found after Google authentication')
    }

    return data.session
  }

  return {
    user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    handleGoogleCallback,
  }
} 