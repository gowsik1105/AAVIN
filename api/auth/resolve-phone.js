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
    const phone = (body.phone || '').replace(/\D/g, '').trim();

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' });
    }

    let supUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wmspmyhwsdefvvhwigav.supabase.co';
    let supKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';

    supUrl = supUrl.trim().replace(/\/+$/, '');
    if (supUrl.endsWith('/rest/v1')) {
      supUrl = supUrl.substring(0, supUrl.length - 8).replace(/\/+$/, '');
    }

    let resolvedEmail = null;

    // Strategy 1: RPC call
    try {
      const rpcResp = await fetch(`${supUrl}/rest/v1/rpc/get_email_by_phone`, {
        method: 'POST',
        headers: {
          'apikey': supKey,
          'Authorization': `Bearer ${supKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lookup_phone: phone })
      });
      if (rpcResp.ok) {
        const rpcData = await rpcResp.json();
        if (typeof rpcData === 'string' && rpcData !== 'null' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rpcData.trim())) {
          resolvedEmail = rpcData.trim().toLowerCase();
        }
      }
    } catch (_) {}

    // Strategy 2: Direct REST profiles table query
    if (!resolvedEmail) {
      const phoneFormats = [phone, `+91${phone}`, `+91 ${phone}`];
      for (const pf of phoneFormats) {
        try {
          const pResp = await fetch(`${supUrl}/rest/v1/profiles?phone=eq.${encodeURIComponent(pf)}&select=email&limit=1`, {
            method: 'GET',
            headers: {
              'apikey': supKey,
              'Authorization': `Bearer ${supKey}`
            }
          });
          if (pResp.ok) {
            const list = await pResp.json();
            if (Array.isArray(list) && list.length > 0 && list[0].email) {
              const cand = String(list[0].email).trim().toLowerCase();
              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cand)) {
                resolvedEmail = cand;
                break;
              }
            }
          }
        } catch (_) {}
      }
    }

    if (resolvedEmail && resolvedEmail !== 'null') {
      return res.status(200).json({
        success: true,
        phone: phone,
        email: resolvedEmail
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `No registered account found for mobile number +91 ${phone}.`
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal error resolving phone number.' });
  }
};
