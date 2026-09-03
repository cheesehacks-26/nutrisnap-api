const express = require('express');
const { supabase, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

// POST /auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  if (req.user.is_dev) return res.json({ success: true }); // no Supabase session to revoke
  const token = req.headers.authorization.split('Bearer ')[1];
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
