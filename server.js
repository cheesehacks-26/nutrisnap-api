require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Service role client — bypasses RLS, used for server-side DB queries
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Middleware — attach user to req if valid JWT in Authorization header
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' })

  req.user = user
  next()
}

// POST /auth/register
// body: { email, password }
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ user: data.user, session: data.session })
})

// POST /auth/login
// body: { email, password }
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })
  res.json({ user: data.user, session: data.session })
})

// POST /auth/logout
// header: Authorization: Bearer <token>
app.post('/auth/logout', requireAuth, async (req, res) => {
  const token = req.headers.authorization.split('Bearer ')[1]
  const { error } = await supabase.auth.admin.signOut(token)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// GET /auth/me  — verify token and return current user
app.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// GET /api/profile
app.get('/api/profile', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ profile: data })
})

// PUT /api/profile
// body: { display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions }
app.put('/api/profile', requireAuth, async (req, res) => {
  const { display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions } = req.body
  const updates = { updated_at: new Date().toISOString() }
  if (display_name          !== undefined) updates.display_name          = display_name
  if (sex                   !== undefined) updates.sex                   = sex
  if (age                   !== undefined) updates.age                   = age
  if (height_in             !== undefined) updates.height_in             = height_in
  if (weight_lbs            !== undefined) updates.weight_lbs            = weight_lbs
  if (goal                  !== undefined) updates.goal                  = goal
  if (activity_level        !== undefined) updates.activity_level        = activity_level
  if (dietary_restrictions  !== undefined) updates.dietary_restrictions  = dietary_restrictions

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ profile: data })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`BadgerBite API running on port ${PORT}`))

module.exports = { requireAuth }
