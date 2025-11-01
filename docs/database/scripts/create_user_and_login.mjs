#!/usr/bin/env node
// Create a Supabase user (admin API) and then log in as that user
// Usage:
//   node scripts/create_user_and_login.mjs --email user@example.com --password secret [--make-seller]
// Env:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { makeSeller: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--email') out.email = args[++i]
    else if (a === '--password') out.password = args[++i]
    else if (a === '--make-seller') out.makeSeller = true
  }
  return out
}

async function main() {
  const { email, password, makeSeller } = parseArgs()
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
    console.error('Missing env. Require VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('Usage: --email user@example.com --password secret [--make-seller]')
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
  const anon = createClient(SUPABASE_URL, ANON_KEY)

  console.log('Creating user (admin)...')
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {},
  })
  if (createErr) {
    console.error('Create user failed:', createErr.message)
    process.exit(1)
  }
  const userId = created.user?.id
  console.log('User created:', userId)

  if (makeSeller) {
    console.log('Granting SELLER role...')
    // Call SQL function via RPC using service role
    const { error: rpcErr } = await admin.rpc('grant_seller', { p_user: userId })
    if (rpcErr) {
      console.error('grant_seller failed:', rpcErr.message)
      process.exit(1)
    }
    console.log('SELLER granted')
  }

  console.log('Signing in as the user...')
  const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({ email, password })
  if (signInErr) {
    console.error('Sign in failed:', signInErr.message)
    process.exit(1)
  }

  const { user, session } = signInData
  console.log('Logged in as:', user.id)
  console.log('Access token (JWT):', session?.access_token)
  console.log('Refresh token:', session?.refresh_token)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

