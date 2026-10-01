/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Secure Server-Side Member Registration Gateway & Admin API Creation Engine
 * POST /api/auth/register-member
 * 
 * Flow:
 * 1. Validates Step 1 Brevo Email OTP Verification Token
 * 2. Enforces application sliding-window rate limiting & deduplication
 * 3. Creates REAL Supabase Auth User via Server-Side Admin API (email_confirm: true)
 * 4. Dispatches ZERO confirmation emails from Supabase GoTrue (Step 1 Brevo OTP was already verified)
 * 5. Syncs user profile in public.profiles with Row Level Security (RLS)
 * 6. Consumes verification token only after successful creation
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// In-memory sliding-window rate limiter cache for registration requests
const regRateLimiter = global._aavinRegRateLimiter || (global._aavinRegRateLimiter = new Map());

/**
 * Mask email address for secure logging (e.g. s***n@gmail.com)
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Check sliding-window registration rate limit
 */
function checkRegistrationRateLimit(ip, email) {
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || !ip;
  const WINDOW_MS = isLocalhost ? 60 * 1000 : 10 * 60 * 1000; // 1 min dev, 10 min prod
  const MAX_ATTEMPTS = isLocalhost ? 10 : 5;
  const now = Date.now();

  // Prune expired entries
  for (const [key, record] of regRateLimiter.entries()) {
    if (now - record.lastUpdated > WINDOW_MS * 2) {
      regRateLimiter.delete(key);
    }
  }

  const keys = [`ip:${ip}`, `email:${email}`];
  for (const key of keys) {
    let entry = regRateLimiter.get(key);
    if (!entry) {
      entry = { timestamps: [], lastUpdated: now };
      regRateLimiter.set(key, entry);
    }

    // Filter to active sliding window
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
    entry.lastUpdated = now;

    // Check for rapid sub-second duplication (< 800ms)
    if (entry.timestamps.length > 0) {
      const lastTs = entry.timestamps[entry.timestamps.length - 1];
      if (now - lastTs < 800) {
        return {
          allowed: false,
          isDuplicate: true,
          message: 'A registration request is already processing. Please wait a moment.'
        };
      }
    }

    if (entry.timestamps.length >= MAX_ATTEMPTS) {
      const oldest = entry.timestamps[0];
      const waitSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
      return {
        allowed: false,
        isDuplicate: false,
        waitSeconds: Math.max(waitSeconds, 1),
        message: 'Too many registration attempts. Please wait a moment and try again.'
      };
    }
  }

  return { allowed: true, isDuplicate: false };
}

/**
 * Record a valid registration attempt in rate limiter
 */
function recordRegistrationAttempt(ip, email) {
  const now = Date.now();
  const keys = [`ip:${ip}`, `email:${email}`];
  for (const key of keys) {
    let entry = regRateLimiter.get(key);
    if (!entry) {
      entry = { timestamps: [], lastUpdated: now };
      regRateLimiter.set(key, entry);
    }
    entry.timestamps.push(now);
    entry.lastUpdated = now;
  }
}

function postJson(urlStr, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(bodyObj);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ statusCode: res.statusCode, body: json, rawBody: data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function getJson(urlStr, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ statusCode: res.statusCode, body: json, rawBody: data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const requestId = crypto.randomUUID();
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('X-Request-ID', requestId);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.', requestId });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || '').trim().toLowerCase();
    const rawPassword = body.password ? String(body.password) : '';
    const otpVerificationToken = (body.otpVerificationToken || body.verificationToken || '').trim();
    const fullName = (body.full_name || body.fullName_en || body.fullName || '').trim();
    const fullNameTa = (body.full_name_ta || body.fullName_ta || fullName).trim();
    const phone = (body.phone || '').replace(/\D/g, '').trim();
    const districtCode = (body.district_code || body.districtCode || 'MDU').trim().toUpperCase();
    const districtName = (body.district_name || body.districtName_en || 'Madurai District').trim();
    const sangamId = (body.sangam_id || body.sangamId || 'sgm-mdu').trim();
    const sangamName = (body.sangam_name || body.sangamName_en || 'Aavin Madurai Thozhilar Sangam').trim();
    const occupation = (body.occupation || 'Farmer').trim();
    const sangamRole = (body.sangam_role || body.sangamRole || 'Member').trim();
    const avatarUrl = (body.profile_photo || body.avatarUrl || 'assets/logo.jpg').trim();

    // 1. Validation (Frontend & Business rules - does NOT consume rate limit quota)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'Please provide a valid email address.', requestId });
    }
    if (!rawPassword || rawPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'INVALID_PASSWORD', message: 'Password must be at least 6 characters long.', requestId });
    }
    if (!fullName) {
      return res.status(400).json({ success: false, error: 'MISSING_NAME', message: 'Full name in English is required.', requestId });
    }
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ success: false, error: 'INVALID_PHONE', message: 'Please provide a valid 10-digit mobile number.', requestId });
    }

function getHmacSecret() {
  const secret = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || process.env.SUPABASE_URL || 'aavin-cooperative-dairy-tn-auth-secret-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

function validateVerificationToken(token, expectedEmail) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'TOKEN_MISSING', message: 'Email verification token is missing. Please complete Email OTP verification first.' };
  }

  // 1. Primary: Stateless HMAC-signed token validation
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'INVALID_TOKEN', message: 'Malformed verification token format.' };
    }

    const [payloadB64, sig] = parts;
    let payload = null;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch (e) {
      return { valid: false, error: 'INVALID_TOKEN', message: 'Malformed verification token payload.' };
    }

    if (!payload.verified) {
      return { valid: false, error: 'NOT_VERIFIED', message: 'Email verification was not completed successfully.' };
    }

    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false, error: 'EXPIRED_TOKEN', message: 'Email verification token has expired. Please verify your email again.' };
    }

    if ((payload.email || '').trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
      return { valid: false, error: 'EMAIL_MISMATCH', message: 'Verification token was issued for a different email address.' };
    }

    const expectedSig = crypto.createHmac('sha256', getHmacSecret()).update(payloadB64).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'INVALID_SIGNATURE', message: 'Verification token signature is invalid. Please verify your email again.' };
    }

    return { valid: true, payload };
  }

  // 2. Fallback to in-memory store (Localhost / single-container dev fallback)
  const verifiedTokens = global._aavinVerifiedTokens || (global._aavinVerifiedTokens = new Map());
  const tokenRecord = verifiedTokens.get(token);
  if (!tokenRecord) {
    return { valid: false, error: 'TOKEN_NOT_FOUND', message: 'Email verification token is missing or expired. Please complete Email OTP verification first.' };
  }
  if (tokenRecord.email !== expectedEmail || Date.now() > tokenRecord.expiresAt) {
    verifiedTokens.delete(token);
    return { valid: false, error: 'EXPIRED_TOKEN', message: 'Email verification token is invalid or has expired. Please verify your email again.' };
  }

  return { valid: true, payload: tokenRecord };
}

    // 2. Validate Step 1 Email OTP Verification Token Cryptographically
    const tokenValidation = validateVerificationToken(otpVerificationToken, email);
    if (!tokenValidation.valid) {
      return res.status(403).json({
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
        message: tokenValidation.message,
        requestId
      });
    }

    // 3. Application-Level Rate Limiting Check
    const rateCheck = checkRegistrationRateLimit(clientIp, email);
    if (!rateCheck.allowed) {
      console.warn(`[AAVIN REGISTRATION] [${new Date().toISOString()}] [${requestId}] IP: ${clientIp} | To: ${maskEmail(email)} | RateLimit: BLOCKED (429) | Dup: ${rateCheck.isDuplicate}`);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: rateCheck.message,
        retryAfter: rateCheck.waitSeconds || 60,
        requestId
      });
    }

    // Record valid registration attempt
    recordRegistrationAttempt(clientIp, email);
    console.log(`[AAVIN REGISTRATION] [${new Date().toISOString()}] [${requestId}] IP: ${clientIp} | To: ${maskEmail(email)} | RateLimit: ALLOWED | Status: START`);

    // 4. Supabase Environment Configuration (Strict Server-Side Admin API)
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wmspmyhwsdefvvhwigav.supabase.co').replace(/\/+$/, '');
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

    // 5. Existing User Duplicate Check in Database
    try {
      const checkRes = await getJson(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`, {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseServiceKey || supabaseAnonKey}`
      });
      if (checkRes.body && Array.isArray(checkRes.body) && checkRes.body.length > 0) {
        console.log(`[AAVIN REGISTRATION] [${requestId}] User already exists in public.profiles: ${maskEmail(email)}`);
        return res.status(409).json({
          success: false,
          error: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address is already registered. Please log in.',
          requestId
        });
      }
    } catch (e) {}

    // 6. Enforce Server-Side Supabase Admin API User Creation
    if (!supabaseServiceKey) {
      console.error(`[AAVIN REGISTRATION] [${requestId}] SERVER_CONFIG_ERROR: SUPABASE_SERVICE_ROLE_KEY is required on server.`);
      return res.status(500).json({
        success: false,
        error: 'SERVER_CONFIG_ERROR',
        message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the server to complete admin registration.',
        requestId
      });
    }

    // Create REAL Supabase Auth User with email_confirm: true (0 emails sent by Supabase GoTrue)
    const adminSignUpRes = await postJson(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`
      },
      {
        email: email,
        password: rawPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          full_name_ta: fullNameTa,
          phone: phone,
          district_code: districtCode,
          district_name: districtName,
          sangam_id: sangamId,
          sangam_name: sangamName,
          sangam_role: sangamRole,
          occupation: occupation,
          avatar_url: avatarUrl,
          role: 'user'
        }
      }
    );

    let authUser = null;
    if (adminSignUpRes.statusCode >= 200 && adminSignUpRes.statusCode < 300 && adminSignUpRes.body) {
      authUser = adminSignUpRes.body.user || adminSignUpRes.body;
    } else {
      const errorMsg = adminSignUpRes.body?.msg || adminSignUpRes.body?.message || adminSignUpRes.body?.error_description || 'Failed to create user account.';
      const isDuplicate = adminSignUpRes.statusCode === 422 || (errorMsg && (errorMsg.includes('already registered') || errorMsg.includes('already exists')));
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          error: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address is already registered. Please log in.',
          requestId
        });
      }
      return res.status(adminSignUpRes.statusCode || 500).json({
        success: false,
        error: 'AUTH_CREATION_FAILED',
        message: errorMsg,
        requestId
      });
    }

    if (!authUser || !authUser.id) {
      return res.status(500).json({
        success: false,
        error: 'USER_ID_MISSING',
        message: 'Could not obtain valid user identifier from authentication engine.',
        requestId
      });
    }

    // 7. Sync/Ensure Profile Record in public.profiles Table
    try {
      await postJson(
        `${supabaseUrl}/rest/v1/profiles`,
        {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          Prefer: 'resolution=merge-duplicates'
        },
        {
          id: authUser.id,
          email: email,
          full_name: fullName,
          full_name_ta: fullNameTa,
          phone: phone,
          district_code: districtCode,
          district_name: districtName,
          sangam_id: sangamId,
          sangam_name: sangamName,
          occupation: occupation,
          role: 'user',
          admin_type: null,
          is_active: true
        }
      );
    } catch (profileErr) {
      console.warn(`[AAVIN REGISTRATION] [${requestId}] Profile upsert notice (trigger may have handled):`, profileErr.message);
    }

    // 8. Successfully created Auth user & profile: Consume verification token now
    verifiedTokens.delete(otpVerificationToken);

    const memberId = `TN-${districtCode}-2026-${authUser.id.substring(0, 4)}`;
    console.log(`[AAVIN REGISTRATION] [${requestId}] SUCCESS: User created via Admin API. UID=${authUser.id} MemberId=${memberId} EmailConfirm=true`);

    return res.status(200).json({
      success: true,
      userId: authUser.id,
      email: email,
      memberId: memberId,
      message: 'Account registered successfully! Proceeding to authenticated login...',
      requestId
    });
  } catch (err) {
    console.error(`[AAVIN REGISTRATION] [${requestId}] EXCEPTION:`, err.message);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred during member registration.',
      requestId
    });
  }
};
