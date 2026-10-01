// Safe server-side diagnostic for Vercel production environment variable auditing
// NEVER prints or returns secret values - only boolean existence and prefix/type info

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const checkVar = (name) => {
    const val = process.env[name];
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      return { present: false, length: 0 };
    }
    return {
      present: true,
      length: val.trim().length,
      startsWith: val.startsWith('eyJ') ? 'jwt_format' : (val.startsWith('sb_') ? 'sb_format' : 'other_format')
    };
  };

  const allEnvKeys = Object.keys(process.env).filter(k => 
    k.toUpperCase().includes('SUPABASE') || 
    k.toUpperCase().includes('ROLE') || 
    k.toUpperCase().includes('BREVO') ||
    k.toUpperCase().includes('VERCEL')
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    vercelUrl: process.env.VERCEL_URL || 'unknown',
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    variables: {
      SUPABASE_SERVICE_ROLE_KEY: checkVar('SUPABASE_SERVICE_ROLE_KEY'),
      SUPABASE_SERVICE_KEY: checkVar('SUPABASE_SERVICE_KEY'),
      SERVICE_ROLE_KEY: checkVar('SERVICE_ROLE_KEY'),
      SUPABASE_SECRET_KEY: checkVar('SUPABASE_SECRET_KEY'),
      SUPABASE_ADMIN_KEY: checkVar('SUPABASE_ADMIN_KEY'),
      VITE_SUPABASE_SERVICE_ROLE_KEY: checkVar('VITE_SUPABASE_SERVICE_ROLE_KEY'),
      BREVO_API_KEY: checkVar('BREVO_API_KEY')
    },
    matchingEnvKeyNames: allEnvKeys
  });
};
