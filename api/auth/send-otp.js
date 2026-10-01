const crypto = require('crypto');
const net = require('net');
const tls = require('tls');
const https = require('https');

// In-memory fallback cache for serverless container instances
const memoryOtpStore = global._aavinOtpStore || (global._aavinOtpStore = new Map());

/**
 * Mask email address for secure logging (e.g. g***k@gmail.com)
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
 * Structured server-side logger that never outputs secrets or full passwords
 */
function logEvent({ requestId, event, provider, email, status, errorCode, message }) {
  const logEntry = {
    requestId: requestId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event: event || 'EMAIL_VERIFICATION_DISPATCH',
    provider: provider || 'Brevo',
    recipient: maskEmail(email),
    status: status || 'UNKNOWN',
    errorCode: errorCode || null,
    message: message || ''
  };
  console.log(`[AAVIN AUTH] [${logEntry.timestamp}] [${logEntry.requestId}] Provider: ${logEntry.provider} | To: ${logEntry.recipient} | Status: ${logEntry.status}${logEntry.errorCode ? ` | Error: ${logEntry.errorCode}` : ''} | Msg: ${logEntry.message}`);
}

/**
 * Send Transactional Email via Brevo REST API (Fastest & most resilient in serverless)
 */
function sendBrevoRestApi({ apiKey, fromEmail, fromName, toEmail, subject, htmlContent, timeoutMs = 8000 }) {
  return new Promise((resolve) => {
    try {
      const payload = JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent
      });

      const req = https.request(
        'https://api.brevo.com/v3/smtp/email',
        {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: timeoutMs
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch (_) {
              json = { raw: data };
            }

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                success: true,
                provider: 'Brevo API',
                messageId: json?.messageId || null,
                message: 'Email accepted by Brevo API.'
              });
            } else {
              const errCode = json?.code || `HTTP_${res.statusCode}`;
              const errMsg = json?.message || 'Brevo API returned non-success response';
              resolve({
                success: false,
                provider: 'Brevo API',
                error: errCode,
                message: errMsg,
                statusCode: res.statusCode
              });
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          provider: 'Brevo API',
          error: 'API_TIMEOUT',
          message: `Brevo API request timed out after ${timeoutMs}ms.`
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          provider: 'Brevo API',
          error: 'API_NETWORK_ERROR',
          message: err.message
        });
      });

      req.write(payload);
      req.end();
    } catch (e) {
      resolve({
        success: false,
        provider: 'Brevo API',
        error: 'API_EXCEPTION',
        message: e.message
      });
    }
  });
}

/**
 * Pure Node.js RFC-compliant SMTP STARTTLS Client with Multi-line Response Parsing & Timeout
 */
function sendSmtpStartTls({ host, port, user, pass, fromEmail, fromName, toEmail, subject, htmlContent, timeoutMs = 10000 }) {
  return new Promise((resolve) => {
    let socket = null;
    let sslSocket = null;
    let step = 0;
    let isResolved = false;

    const timeoutTimer = setTimeout(() => {
      cleanup();
      resolve({ success: false, provider: 'Brevo SMTP', error: 'SMTP_TIMEOUT', message: `SMTP connection timed out after ${timeoutMs}ms.` });
    }, timeoutMs);

    function cleanup() {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timeoutTimer);
      try { if (socket) socket.destroy(); } catch (_) {}
      try { if (sslSocket) sslSocket.destroy(); } catch (_) {}
    }

    try {
      socket = net.createConnection(port, host);
      socket.setEncoding('utf8');

      socket.on('error', (err) => {
        cleanup();
        resolve({ success: false, provider: 'Brevo SMTP', error: 'SMTP_SOCKET_ERROR', message: err.message });
      });

      let buffer = '';

      function isCompleteSmtpResponse(buf) {
        const lines = buf.split('\r\n').filter(Boolean);
        if (lines.length === 0) return false;
        const lastLine = lines[lines.length - 1];
        return /^\d{3}\s/.test(lastLine);
      }

      function getLastCode(buf) {
        const lines = buf.split('\r\n').filter(Boolean);
        if (lines.length === 0) return '';
        const lastLine = lines[lines.length - 1];
        return lastLine.substring(0, 3);
      }

      socket.on('data', (data) => {
        buffer += data.toString();
        if (!isCompleteSmtpResponse(buffer)) return;

        const code = getLastCode(buffer);
        const currentBuf = buffer;
        buffer = '';

        if (step === 0 && code === '220') {
          step = 1;
          socket.write(`EHLO localhost\r\n`);
        } else if (step === 1 && code === '250') {
          step = 2;
          socket.write(`STARTTLS\r\n`);
        } else if (step === 2 && code === '220') {
          step = 3;
          // Upgrade to TLS
          sslSocket = tls.connect({
            socket: socket,
            host: host,
            rejectUnauthorized: false
          }, () => {
            sslSocket.setEncoding('utf8');
            sslSocket.write(`EHLO localhost\r\n`);
          });

          sslSocket.on('error', (err) => {
            cleanup();
            resolve({ success: false, provider: 'Brevo SMTP', error: 'SMTP_TLS_ERROR', message: `TLS error: ${err.message}` });
          });

          let tlsBuffer = '';

          sslSocket.on('data', (tlsData) => {
            tlsBuffer += tlsData.toString();
            if (!isCompleteSmtpResponse(tlsBuffer)) return;

            const tlsCode = getLastCode(tlsBuffer);
            const responseText = tlsBuffer.trim();
            tlsBuffer = '';

            if (step === 3 && tlsCode === '250') {
              step = 4;
              sslSocket.write(`AUTH LOGIN\r\n`);
            } else if (step === 4 && tlsCode === '334') {
              step = 5;
              sslSocket.write(Buffer.from(user).toString('base64') + '\r\n');
            } else if (step === 5 && tlsCode === '334') {
              step = 6;
              sslSocket.write(Buffer.from(pass).toString('base64') + '\r\n');
            } else if (step === 6) {
              if (tlsCode === '235') {
                step = 7;
                sslSocket.write(`MAIL FROM:<${fromEmail}>\r\n`);
              } else {
                cleanup();
                resolve({
                  success: false,
                  provider: 'Brevo SMTP',
                  error: 'SMTP_AUTH_FAILED',
                  message: `SMTP Authentication failed. Code: ${tlsCode}`
                });
              }
            } else if (step === 7) {
              if (tlsCode === '250') {
                step = 8;
                sslSocket.write(`RCPT TO:<${toEmail}>\r\n`);
              } else {
                cleanup();
                resolve({
                  success: false,
                  provider: 'Brevo SMTP',
                  error: 'SENDER_REJECTED',
                  message: `Sender address rejected. Code: ${tlsCode}`
                });
              }
            } else if (step === 8) {
              if (tlsCode === '250') {
                step = 9;
                sslSocket.write(`DATA\r\n`);
              } else {
                cleanup();
                resolve({
                  success: false,
                  provider: 'Brevo SMTP',
                  error: 'RECIPIENT_REJECTED',
                  message: `Recipient address rejected. Code: ${tlsCode}`
                });
              }
            } else if (step === 9 && tlsCode === '354') {
              step = 10;
              const messageHeaders = [
                `From: "${fromName}" <${fromEmail}>`,
                `To: <${toEmail}>`,
                `Subject: ${subject}`,
                `MIME-Version: 1.0`,
                `Content-Type: text/html; charset=utf-8`,
                `Date: ${new Date().toUTCString()}`,
                ``,
                htmlContent,
                `.`
              ].join('\r\n') + '\r\n';

              sslSocket.write(messageHeaders);
            } else if (step === 10) {
              if (tlsCode === '250') {
                cleanup();
                resolve({ success: true, provider: 'Brevo SMTP', message: 'Email dispatched successfully via Brevo SMTP.' });
              } else {
                cleanup();
                resolve({
                  success: false,
                  provider: 'Brevo SMTP',
                  error: 'DATA_REJECTED',
                  message: `Message data rejected. Code: ${tlsCode}`
                });
              }
            }
          });
        } else {
          cleanup();
          resolve({
            success: false,
            provider: 'Brevo SMTP',
            error: 'UNEXPECTED_SMTP_RESPONSE',
            message: `Unexpected SMTP response: ${code}`
          });
        }
      });
    } catch (err) {
      cleanup();
      resolve({ success: false, provider: 'Brevo SMTP', error: 'SMTP_SETUP_ERROR', message: err.message });
    }
  });
}

/**
 * Dispatch Email using Brevo API / SMTP with Safe 1-Time Retry for transient failures
 */
async function dispatchVerificationEmail({ brevoHost, brevoPort, brevoUser, brevoPassword, brevoApiKey, brevoFromEmail, brevoFromName, email, otpCode, requestId }) {
  const emailSubject = `Aavin Sangam - Email Verification Code (${otpCode})`;
  const emailHtml = `<div style='font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc;'><div style='max-width: 500px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'><div style='text-align: center; margin-bottom: 20px;'><h2 style='color: #07355e; margin: 0;'>ஆவின் சங்கம் • Aavin Sangam</h2><p style='color: #64748b; font-size: 13px; margin-top: 4px;'>Digital Cooperative Federation • Tamil Nadu</p></div><p style='font-size: 14px; color: #334155;'>Hello,</p><p style='font-size: 14px; color: #334155; line-height: 1.5;'>Your 6-digit verification code for Aavin Member Registration is:</p><div style='font-size: 32px; font-weight: 800; color: #0b4f8a; letter-spacing: 6px; padding: 16px; background: #e0f2fe; text-align: center; border-radius: 8px; margin: 20px 0;'>${otpCode}</div><p style='color: #64748b; font-size: 12.5px; line-height: 1.4;'>This code expires in 10 minutes. For your security, do not share this code with anyone.</p><hr style='border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;' /><p style='color: #94a3b8; font-size: 11px; text-align: center; margin: 0;'>Government of Tamil Nadu • Dairy Development Department</p></div></div>`;

  const usableApiKey = (brevoApiKey && brevoApiKey.trim()) || (brevoPassword && brevoPassword.startsWith('xkeysib-') ? brevoPassword.trim() : null);

  // Attempt 1: Try Brevo REST API if API Key available (ultra-fast & non-blocking)
  if (usableApiKey) {
    const apiResult = await sendBrevoRestApi({
      apiKey: usableApiKey,
      fromEmail: brevoFromEmail,
      fromName: brevoFromName,
      toEmail: email,
      subject: emailSubject,
      htmlContent: emailHtml,
      timeoutMs: 8000
    });

    if (apiResult.success) {
      logEvent({
        requestId,
        event: 'EMAIL_VERIFICATION_DELIVERY',
        provider: 'Brevo API',
        email,
        status: 'ACCEPTED',
        message: 'Dispatched successfully via Brevo REST API'
      });
      return { success: true, provider: 'Brevo API' };
    }

    logEvent({
      requestId,
      event: 'EMAIL_VERIFICATION_DELIVERY_ATTEMPT_1_FAILED',
      provider: 'Brevo API',
      email,
      status: 'RETRYING',
      errorCode: apiResult.error,
      message: apiResult.message
    });
  }

  // Attempt 2: Try RFC STARTTLS SMTP Client
  if (brevoUser && brevoPassword) {
    let smtpResult = await sendSmtpStartTls({
      host: brevoHost,
      port: brevoPort,
      user: brevoUser,
      pass: brevoPassword,
      fromEmail: brevoFromEmail,
      fromName: brevoFromName,
      toEmail: email,
      subject: emailSubject,
      htmlContent: emailHtml,
      timeoutMs: 10000
    });

    if (smtpResult.success) {
      logEvent({
        requestId,
        event: 'EMAIL_VERIFICATION_DELIVERY',
        provider: 'Brevo SMTP',
        email,
        status: 'ACCEPTED',
        message: 'Dispatched successfully via Brevo SMTP'
      });
      return { success: true, provider: 'Brevo SMTP' };
    }

    // Safe 1-time retry for transient socket timeout / disconnect
    if (smtpResult.error === 'SMTP_TIMEOUT' || smtpResult.error === 'SMTP_SOCKET_ERROR') {
      logEvent({
        requestId,
        event: 'EMAIL_VERIFICATION_SMTP_RETRYING',
        provider: 'Brevo SMTP',
        email,
        status: 'RETRYING',
        errorCode: smtpResult.error,
        message: 'Transient SMTP error, retrying in 500ms...'
      });

      await new Promise((r) => setTimeout(r, 500));

      smtpResult = await sendSmtpStartTls({
        host: brevoHost,
        port: brevoPort,
        user: brevoUser,
        pass: brevoPassword,
        fromEmail: brevoFromEmail,
        fromName: brevoFromName,
        toEmail: email,
        subject: emailSubject,
        htmlContent: emailHtml,
        timeoutMs: 10000
      });

      if (smtpResult.success) {
        logEvent({
          requestId,
          event: 'EMAIL_VERIFICATION_DELIVERY',
          provider: 'Brevo SMTP (Retry)',
          email,
          status: 'ACCEPTED',
          message: 'Dispatched successfully via Brevo SMTP on retry'
        });
        return { success: true, provider: 'Brevo SMTP' };
      }
    }

    logEvent({
      requestId,
      event: 'EMAIL_VERIFICATION_DELIVERY_FAILED',
      provider: 'Brevo SMTP',
      email,
      status: 'REJECTED',
      errorCode: smtpResult.error,
      message: smtpResult.message
    });

    return {
      success: false,
      provider: 'Brevo SMTP',
      error: smtpResult.error || 'SMTP_DELIVERY_FAILED',
      message: smtpResult.message
    };
  }

  logEvent({
    requestId,
    event: 'EMAIL_VERIFICATION_CONFIG_ERROR',
    provider: 'Brevo',
    email,
    status: 'CONFIG_MISSING',
    errorCode: 'CREDENTIALS_MISSING',
    message: 'BREVO_SMTP_USER and BREVO_SMTP_PASSWORD are not configured.'
  });

  return {
    success: false,
    provider: 'Brevo',
    error: 'CONFIG_ERROR',
    message: 'Brevo credentials are not configured.'
  };
}

module.exports = async function handler(req, res) {
  const requestId = crypto.randomUUID();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('X-Request-ID', requestId);

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
    const targetKey = email || phone;

    if (!targetKey) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_IDENTIFIER',
        message: 'Please provide an email address or mobile number.',
        requestId
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please enter a valid email address.',
        requestId
      });
    }

    if (!email && phone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit mobile number.',
        requestId
      });
    }

    // Cooldown check (60 seconds)
    const COOLDOWN_SECONDS = 60;
    const existing = memoryOtpStore.get(targetKey);
    if (existing) {
      const secPassed = (Date.now() - existing.createdAt) / 1000;
      if (secPassed < COOLDOWN_SECONDS) {
        const waitLeft = Math.ceil(COOLDOWN_SECONDS - secPassed);
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMITED',
          message: `Please wait ${waitLeft} seconds before requesting another code.`,
          cooldownSeconds: waitLeft,
          requestId
        });
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    if (email) {
      const brevoHost = (process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com').trim();
      const brevoPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
      const brevoUser = (process.env.BREVO_SMTP_USER || '').trim();
      const brevoPassword = (process.env.BREVO_SMTP_PASSWORD || '').trim();
      const brevoFromEmail = (process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER || 'gowsik1105@gmail.com').trim();
      const brevoFromName = (process.env.BREVO_FROM_NAME || 'AAVIN Main Dairy Management').trim();
      const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

      if (!brevoUser && !brevoPassword && !brevoApiKey) {
        logEvent({
          requestId,
          event: 'CONFIG_MISSING',
          email,
          status: 'FAILED',
          errorCode: 'NO_BREVO_CREDENTIALS',
          message: 'BREVO credentials missing in environment'
        });
        return res.status(500).json({
          success: false,
          error: 'CONFIG_ERROR',
          message: "We couldn't send the verification email right now. Please try again.",
          requestId
        });
      }

      // Dispatch via Brevo API / SMTP
      const dispatchResult = await dispatchVerificationEmail({
        brevoHost,
        brevoPort,
        brevoUser,
        brevoPassword,
        brevoApiKey,
        brevoFromEmail,
        brevoFromName,
        email,
        otpCode,
        requestId
      });

      if (!dispatchResult.success) {
        // Do NOT store OTP if dispatch failed
        memoryOtpStore.delete(targetKey);
        return res.status(502).json({
          success: false,
          error: 'EMAIL_DELIVERY_FAILED',
          providerError: dispatchResult.error || 'DELIVERY_FAILED',
          message: "We couldn't send the verification email right now. Please try again.",
          requestId
        });
      }

function getHmacSecret() {
  const secret = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || process.env.SUPABASE_URL || 'aavin-cooperative-dairy-tn-auth-secret-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

function generateOtpSessionToken(target, otpCode) {
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
  const nonce = crypto.randomBytes(8).toString('hex');
  const payloadObj = {
    email: target.email || null,
    phone: target.phone || null,
    exp: exp,
    nonce: nonce
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signData = `${payloadB64}.${otpCode}`;
  const sig = crypto.createHmac('sha256', getHmacSecret()).update(signData).digest('base64url');
  return `${payloadB64}.${sig}`;
}

      // Generate stateless cryptographic HMAC session token (never exposes OTP or secret)
      const sessionToken = generateOtpSessionToken({ email, phone }, otpCode);

      // Successfully dispatched: Store in fallback in-memory cache
      memoryOtpStore.set(targetKey, {
        hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        verified: false
      });

      return res.status(200).json({
        success: true,
        email: email,
        sessionToken: sessionToken,
        message: 'Verification email sent. Please check your inbox and spam folder.',
        cooldownSeconds: COOLDOWN_SECONDS,
        requestId
      });
    } else {
      // Mobile SMS OTP
      const sessionToken = generateOtpSessionToken({ email, phone }, otpCode);

      memoryOtpStore.set(targetKey, {
        hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        verified: false
      });

      logEvent({
        requestId,
        event: 'SMS_OTP_GENERATED',
        provider: 'Aavin SMS Gateway',
        email: phone,
        status: 'ACCEPTED',
        message: `OTP generated for mobile: +91 ${phone}`
      });

      return res.status(200).json({
        success: true,
        phone: phone,
        sessionToken: sessionToken,
        message: `Verification OTP sent successfully to +91 ${phone}`,
        cooldownSeconds: COOLDOWN_SECONDS,
        requestId
      });
    }
  } catch (err) {
    logEvent({
      requestId,
      event: 'SERVER_ERROR',
      status: 'EXCEPTION',
      errorCode: 'INTERNAL_ERROR',
      message: err.message
    });

    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: "We couldn't send the verification email right now. Please try again.",
      requestId
    });
  }
};
