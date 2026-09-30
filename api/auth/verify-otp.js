const crypto = require('crypto');

const memoryOtpStore = global._aavinOtpStore || (global._aavinOtpStore = new Map());

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
    const targetKey = email || phone;

    if (!targetKey) {
      return res.status(400).json({ success: false, error: 'MISSING_IDENTIFIER', message: 'Invalid email or mobile format.' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ success: false, error: 'INVALID_CODE', message: 'Please enter the complete 6-digit verification code.' });
    }

    const entry = memoryOtpStore.get(targetKey);
    if (!entry) {
      return res.status(400).json({ success: false, error: 'NO_OTP_SENT', message: 'No active OTP request found for this account. Please click Resend Code.' });
    }

    if (Date.now() > entry.expiresAt) {
      memoryOtpStore.delete(targetKey);
      return res.status(400).json({ success: false, error: 'EXPIRED_OTP', message: 'Verification code has expired. Please request a new code.' });
    }

    if (entry.attempts >= 5) {
      memoryOtpStore.delete(targetKey);
      return res.status(400).json({ success: false, error: 'MAX_ATTEMPTS', message: 'Too many incorrect attempts. Please request a fresh code.' });
    }

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');

    if (entry.hashedOtp !== inputHash) {
      entry.attempts += 1;
      const remaining = 5 - entry.attempts;
      return res.status(400).json({
        success: false,
        error: 'WRONG_OTP',
        message: `Incorrect verification code. ${remaining} attempt(s) remaining.`
      });
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    memoryOtpStore.delete(targetKey);

    const verifiedTokens = global._aavinVerifiedTokens || (global._aavinVerifiedTokens = new Map());
    verifiedTokens.set(verificationToken, {
      email: email,
      phone: phone,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes validity
    });

    return res.status(200).json({
      success: true,
      email: email,
      phone: phone,
      verified: true,
      verificationToken: verificationToken,
      message: 'Account verified successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error verifying OTP.' });
  }
};
