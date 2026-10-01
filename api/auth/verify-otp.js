const crypto = require('crypto');

function getHmacSecret() {
  const secret = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || process.env.SUPABASE_URL || 'aavin-cooperative-dairy-tn-auth-secret-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

function verifyOtpWithHmac(target, code, sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string' || !sessionToken.includes('.')) {
    return { valid: false, error: 'NO_OTP_SENT', message: 'No active OTP session found. Please click Resend Code.' };
  }

  const parts = sessionToken.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'INVALID_TOKEN', message: 'Invalid verification session token format.' };
  }

  const [payloadB64, sig] = parts;
  let payload = null;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (e) {
    return { valid: false, error: 'INVALID_TOKEN', message: 'Malformed session token payload.' };
  }

  // 1. Check expiration
  if (!payload.exp || Date.now() > payload.exp) {
    return { valid: false, error: 'EXPIRED_OTP', message: 'Verification code has expired. Please request a new code.' };
  }

  // 2. Check target match
  const requestedTarget = (target.email || target.phone || '').trim().toLowerCase();
  const tokenTarget = (payload.email || payload.phone || '').trim().toLowerCase();
  if (requestedTarget && tokenTarget && requestedTarget !== tokenTarget) {
    return { valid: false, error: 'TARGET_MISMATCH', message: 'Verification code was requested for a different account.' };
  }

  // 3. Recompute and timing-safe compare HMAC signature
  const signData = `${payloadB64}.${code}`;
  const expectedSig = crypto.createHmac('sha256', getHmacSecret()).update(signData).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return {
      valid: false,
      error: 'WRONG_OTP',
      message: 'Incorrect verification code. Please check your email and try again.'
    };
  }

  return {
    valid: true,
    email: payload.email || target.email,
    phone: payload.phone || target.phone
  };
}

function generateVerificationToken(target) {
  const exp = Date.now() + 30 * 60 * 1000; // 30 minutes validity for registration
  const nonce = crypto.randomBytes(16).toString('hex');
  const payloadObj = {
    email: target.email || null,
    phone: target.phone || null,
    verified: true,
    exp: exp,
    nonce: nonce
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', getHmacSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
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
    const phone = (body.phone || '').replace(/\D/g, '').trim();
    const code = (body.otp || '').replace(/\D/g, '').trim();
    const sessionToken = (body.sessionToken || body.otpSessionToken || '').trim();
    const targetKey = email || phone;

    if (!targetKey) {
      return res.status(400).json({ success: false, error: 'MISSING_IDENTIFIER', message: 'Invalid email or mobile format.' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ success: false, error: 'INVALID_CODE', message: 'Please enter the complete 6-digit verification code.' });
    }

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'NO_OTP_SENT',
        message: 'No active OTP request found for this account. Please click Resend Code.'
      });
    }

    // Stateless HMAC verification (Vercel Serverless & Distributed)
    const hmacResult = verifyOtpWithHmac({ email, phone }, code, sessionToken);
    if (!hmacResult.valid) {
      return res.status(400).json({
        success: false,
        error: hmacResult.error,
        message: hmacResult.message
      });
    }

    const verificationToken = generateVerificationToken({ email: hmacResult.email, phone: hmacResult.phone });

    return res.status(200).json({
      success: true,
      email: hmacResult.email,
      phone: hmacResult.phone,
      verified: true,
      verificationToken: verificationToken,
      message: 'Email verified successfully! Proceed to personal details.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error verifying OTP.' });
  }
};
