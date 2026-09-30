// Unified Environment Config Provider for Browser & Vercel Serverless

if (typeof window !== 'undefined') {
  const defaultUrl = 'https://wmspmyhwsdefvvhwigav.supabase.co';
  const defaultKey = 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';
  window.__ENV__ = Object.assign(window.__ENV__ || {}, {
    VITE_SUPABASE_URL: window.VITE_SUPABASE_URL || defaultUrl,
    VITE_SUPABASE_ANON_KEY: window.VITE_SUPABASE_ANON_KEY || defaultKey
  });
  window.VITE_SUPABASE_URL = window.__ENV__.VITE_SUPABASE_URL;
  window.VITE_SUPABASE_ANON_KEY = window.__ENV__.VITE_SUPABASE_ANON_KEY;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    let supUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wmspmyhwsdefvvhwigav.supabase.co';
    let supKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';

    supUrl = supUrl.trim().replace(/\/+$/, '');
    if (supUrl.endsWith('/rest/v1')) {
      supUrl = supUrl.substring(0, supUrl.length - 8).replace(/\/+$/, '');
    }

    if (req.url && req.url.includes('.js')) {
      const jsCode = `window.__ENV__ = Object.assign(window.__ENV__ || {}, { VITE_SUPABASE_URL: '${supUrl}', VITE_SUPABASE_ANON_KEY: '${supKey}' }); window.VITE_SUPABASE_URL = '${supUrl}'; window.VITE_SUPABASE_ANON_KEY = '${supKey}';`;
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.status(200).send(jsCode);
    }

    return res.status(200).json({
      VITE_SUPABASE_URL: supUrl,
      VITE_SUPABASE_ANON_KEY: supKey
    });
  };
}
