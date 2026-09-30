/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Secure Server-Side Member Registration Gateway
 * POST /api/auth/register-member
 */

const https = require('https');
const http = require('http');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' });
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

    // 1. Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
    }
    if (!rawPassword || rawPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'INVALID_PASSWORD', message: 'Password must be at least 6 characters long.' });
    }
    if (!fullName) {
      return res.status(400).json({ success: false, error: 'MISSING_NAME', message: 'Full name in English is required.' });
    }
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ success: false, error: 'INVALID_PHONE', message: 'Please provide a valid 10-digit mobile number.' });
    }

    // 2. Validate & Consume Brevo OTP Verification Token
    const verifiedTokens = global._aavinVerifiedTokens || (global._aavinVerifiedTokens = new Map());
    const tokenRecord = verifiedTokens.get(otpVerificationToken);

    if (!otpVerificationToken || !tokenRecord) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Email verification token is missing or expired. Please complete Email OTP verification first.'
      });
    }

    if (tokenRecord.email !== email || Date.now() > tokenRecord.expiresAt) {
      verifiedTokens.delete(otpVerificationToken);
      return res.status(403).json({
        success: false,
        error: 'TOKEN_MISMATCH_OR_EXPIRED',
        message: 'Email verification token is invalid or has expired. Please verify your email again.'
      });
    }

    // Immediately consume token to prevent replay attacks
    verifiedTokens.delete(otpVerificationToken);

    // 3. Supabase Environment Configuration
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wmspmyhwsdefvvhwigav.supabase.co').replace(/\/+$/, '');
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

    // 4. Duplicate Check
    try {
      const checkRes = await getJson(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`, {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseServiceKey || supabaseAnonKey}`
      });
      if (checkRes.body && Array.isArray(checkRes.body) && checkRes.body.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address is already registered. Please log in.'
        });
      }
    } catch (e) {}

    // 5. Create Supabase Auth User
    let authUser = null;

    if (supabaseServiceKey) {
      // Admin creation: Marks email_confirm = true so GoTrue sends 0 confirmation emails (bypassing rate limit)
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

      if (adminSignUpRes.statusCode >= 200 && adminSignUpRes.statusCode < 300 && adminSignUpRes.body) {
        authUser = adminSignUpRes.body.user || adminSignUpRes.body;
      } else {
        const errorMsg = adminSignUpRes.body?.msg || adminSignUpRes.body?.message || adminSignUpRes.body?.error_description || 'Failed to create user account.';
        return res.status(adminSignUpRes.statusCode || 400).json({
          success: false,
          error: 'AUTH_CREATION_FAILED',
          message: errorMsg
        });
      }
    } else {
      // Standard SignUp
      const signUpRes = await postJson(
        `${supabaseUrl}/auth/v1/signup`,
        {
          apikey: supabaseAnonKey
        },
        {
          email: email,
          password: rawPassword,
          data: {
            full_name: fullName,
            full_name_ta: fullNameTa,
            phone: phone,
            district_code: districtCode,
            district_name: districtName,
            sangam_role: sangamRole,
            occupation: occupation,
            avatar_url: avatarUrl,
            role: 'user'
          }
        }
      );

      if (signUpRes.statusCode >= 200 && signUpRes.statusCode < 300 && signUpRes.body) {
        authUser = signUpRes.body.user || signUpRes.body;
      } else {
        const errorMsg = signUpRes.body?.msg || signUpRes.body?.message || signUpRes.body?.error_description || 'Registration request could not be completed.';
        const statusCode = signUpRes.statusCode || 400;
        const is429 = statusCode === 429 || (errorMsg && (errorMsg.includes('rate limit') || errorMsg.includes('security purposes') || errorMsg.includes('429')));
        const is409 = statusCode === 422 || (errorMsg && (errorMsg.includes('already registered') || errorMsg.includes('already exists')));

        if (is429) {
          console.warn('[AAVIN REGISTRATION] [429 DETECTED] Supabase Auth Rate Limit for:', email);
          return res.status(429).json({
            success: false,
            error: 'RATE_LIMITED',
            message: 'Registration rate limit reached. Please wait a moment before trying again.',
            retryAfter: 60
          });
        }

        if (is409) {
          return res.status(409).json({
            success: false,
            error: 'USER_ALREADY_EXISTS',
            message: 'An account with this email address is already registered. Please log in.'
          });
        }

        return res.status(statusCode).json({
          success: false,
          error: 'AUTH_SIGNUP_FAILED',
          message: errorMsg
        });
      }
    }

    if (!authUser || !authUser.id) {
      return res.status(500).json({
        success: false,
        error: 'USER_ID_MISSING',
        message: 'Could not obtain valid user identifier from authentication engine.'
      });
    }

    const memberId = `TN-${districtCode}-2026-${authUser.id.substring(0, 4)}`;

    return res.status(200).json({
      success: true,
      userId: authUser.id,
      email: email,
      memberId: memberId,
      message: 'Account registered successfully! Proceeding to authenticated login...'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred during member registration.'
    });
  }
};
