// Supabase Edge Function: send-email-otp
// Dispatches secure 6-digit email OTP using Brevo Transactional Email Engine

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "***";
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// In-memory OTP cache for edge runtime instance
const otpStore = new Map<string, { otp: string; expiresAt: number; createdAt: number }>();

serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders, "X-Request-ID": requestId } });
  }

  try {
    const { email } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_EMAIL",
          message: "Please provide a valid email address.",
          requestId
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
      );
    }

    // Rate limiting: 60 seconds cooldown
    const COOLDOWN_MS = 60000;
    const existing = otpStore.get(cleanEmail);
    const now = Date.now();
    if (existing && now - existing.createdAt < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - existing.createdAt)) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          error: "RATE_LIMITED",
          message: `Please wait ${waitSec} seconds before requesting another code.`,
          cooldownSeconds: waitSec,
          requestId
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
      );
    }

    // Generate 6-digit secure crypto OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otpCode = (100000 + (array[0] % 900000)).toString();

    // Brevo API credentials
    const brevoApiKey = Deno.env.get("BREVO_API_KEY") || Deno.env.get("BREVO_SMTP_PASSWORD");
    const brevoFromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@aavin.com";
    const brevoFromName = Deno.env.get("BREVO_FROM_NAME") || "AAVIN Main Dairy Management";

    let emailSent = false;
    let brevoMessageId = "";

    if (brevoApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            sender: { name: brevoFromName, email: brevoFromEmail },
            to: [{ email: cleanEmail }],
            subject: `Aavin Sangam - Email Verification Code (${otpCode})`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #07355e; margin: 0;">ஆவின் சங்கம் • Aavin Sangam</h2>
                    <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Digital Cooperative Federation • Tamil Nadu</p>
                  </div>
                  <p style="font-size: 14px; color: #334155;">Hello,</p>
                  <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                    Your 6-digit verification code for Aavin Member Registration is:
                  </p>
                  <div style="font-size: 32px; font-weight: 800; color: #0b4f8a; letter-spacing: 6px; padding: 16px; background: #e0f2fe; text-align: center; border-radius: 8px; margin: 20px 0;">
                    ${otpCode}
                  </div>
                  <p style="color: #64748b; font-size: 12.5px; line-height: 1.4;">
                    This code expires in 10 minutes. For your security, do not share this code with anyone.
                  </p>
                  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                    Government of Tamil Nadu • Dairy Development Department
                  </p>
                </div>
              </div>
            `
          })
        });

        clearTimeout(timeoutId);

        if (brevoRes.ok) {
          const resJson = await brevoRes.json();
          emailSent = true;
          brevoMessageId = resJson?.messageId || "";
        }
      } catch (fetchErr) {
        console.warn(`[AAVIN AUTH] [${new Date().toISOString()}] [${requestId}] Provider: Brevo API | To: ${maskEmail(cleanEmail)} | Status: EXCEPTION | Error: ${fetchErr.message}`);
      }
    }

    if (!emailSent) {
      console.error(`[AAVIN AUTH] [${new Date().toISOString()}] [${requestId}] Provider: Brevo | To: ${maskEmail(cleanEmail)} | Status: REJECTED | Error: EMAIL_SEND_FAILED`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "EMAIL_DELIVERY_FAILED",
          message: "We couldn't send the verification email right now. Please try again.",
          requestId
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
      );
    }

    // Store in memory cache only after verified dispatch
    otpStore.set(cleanEmail, {
      otp: otpCode,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`[AAVIN AUTH] [${new Date().toISOString()}] [${requestId}] Provider: Brevo API | To: ${maskEmail(cleanEmail)} | Status: ACCEPTED | MsgId: ${brevoMessageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        email: cleanEmail,
        message: "Verification email sent. Please check your inbox and spam folder.",
        cooldownSeconds: 60,
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "SERVER_ERROR",
        message: "We couldn't send the verification email right now. Please try again.",
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } }
    );
  }
});
