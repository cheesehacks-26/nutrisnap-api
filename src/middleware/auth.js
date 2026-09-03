const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Dev access bypass ────────────────────────────────────────────────────────
// Lets local tooling / tests act as a fixed existing user without a real
// Supabase session. Double-gated: only outside production AND only when both
// DEV_ACCESS_TOKEN and DEV_USER_ID are set. Never set these on a deployed env.
const DEV_ACCESS_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  !!process.env.DEV_ACCESS_TOKEN &&
  !!process.env.DEV_USER_ID;

function devUserFor(token) {
  if (!DEV_ACCESS_ENABLED || token !== process.env.DEV_ACCESS_TOKEN) return null;
  return { id: process.env.DEV_USER_ID, email: 'dev@local', is_dev: true };
}

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const devUser = devUserFor(token);
  if (devUser) { req.user = devUser; return next(); }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = user;
  next();
}

// Like requireAuth but never rejects — sets req.user if a valid token is present,
// otherwise leaves req.user undefined and calls next() anyway.
async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return next();

  const devUser = devUserFor(token);
  if (devUser) { req.user = devUser; return next(); }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) req.user = user;
  } catch {
    // Ignore — treat as unauthenticated
  }
  next();
}

module.exports = { supabase, supabaseAdmin, requireAuth, optionalAuth, DEV_ACCESS_ENABLED };
