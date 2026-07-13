import { ALLOWED_EMAIL, supabase } from './supabaseClient.js'

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signInWithMagicLink(email) {
  if (!supabase) throw new Error('Supabase non configurato')
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    throw new Error('Email non autorizzata')
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}
