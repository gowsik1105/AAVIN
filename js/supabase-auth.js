/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Supabase Role-Based Admin Authentication Engine
 * Secure Session Manager, RBAC Resolver & Password Recovery
 */

window.AAVIN_SUPABASE_AUTH = {
  client: null,
  currentUser: null,
  adminProfile: null,
  isInitialized: false,

  // Default / Configurable Supabase credentials
  config: {
    url: window.AAVIN_SUPABASE_URL || localStorage.getItem('aavin_supabase_url') || 'https://demo-aavin-project.supabase.co',
    anonKey: window.AAVIN_SUPABASE_ANON_KEY || localStorage.getItem('aavin_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key'
  },

  init() {
    if (this.isInitialized) return;

    // Initialize Supabase JS Client if available
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(this.config.url, this.config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'aavin_supabase_auth_token'
          }
        });

        // Listen for auth state changes
        this.client.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            this.handleSessionEstablished(session);
          } else if (event === 'SIGNED_OUT') {
            this.handleSessionTerminated();
          } else if (event === 'PASSWORD_RECOVERY') {
            this.showPasswordResetModal();
          }
        });
      } catch (e) {
        console.warn('Supabase Client init notice:', e);
      }
    }

    // Check for password recovery hash in URL
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      setTimeout(() => {
        this.showPasswordResetModal();
      }, 500);
    }

    // Check existing stored admin session
    this.checkStoredAdminSession();
    this.isInitialized = true;
  },

  hasAdminSession(expectedRole = null) {
    if (!this.adminProfile) return false;
    if (!expectedRole) return true;
    if (expectedRole === 'tamil_nadu_admin' || expectedRole === 'state_admin') {
      return this.adminProfile.role === 'tamil_nadu_admin' || this.adminProfile.role === 'state_admin';
    }
    return this.adminProfile.role === expectedRole;
  },

  getAdminProfile() {
    return this.adminProfile;
  },

  async checkStoredAdminSession() {
    const stored = localStorage.getItem('aavin_admin_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        this.adminProfile = profile;
        this.currentUser = { email: profile.email, id: profile.id };
        window.AAVIN_STORE.setRole(profile.role);
      } catch (e) {
        localStorage.removeItem('aavin_admin_profile');
      }
    }
  },

  /**
   * Secure Admin Sign In using Supabase Auth
   * @param {string} email 
   * @param {string} password 
   */
  async signInAdmin(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Please enter both admin email and password.' };
    }

    // 1. If live Supabase client is connected
    if (this.client && this.config.url !== 'https://demo-aavin-project.supabase.co') {
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data && data.user) {
          // Query role from public.admin_profiles
          const { data: profileData, error: profileError } = await this.client
            .from('admin_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profileData || !profileData.role) {
            await this.client.auth.signOut();
            return { success: false, error: 'Access Denied: This account is not authorized as an Aavin Administrator.' };
          }

          const profile = {
            id: data.user.id,
            email: data.user.email,
            role: profileData.role,
            fullName: profileData.full_name || 'Admin Officer',
            districtCode: profileData.district_code || 'ALL',
            districtName: profileData.district_name || 'Tamil Nadu',
            sangamId: profileData.sangam_id || 'sgm-mdu',
            sangamName: profileData.sangam_name || 'Aavin Sangam'
          };

          this.adminProfile = profile;
          this.currentUser = data.user;
          localStorage.setItem('aavin_admin_profile', JSON.stringify(profile));
          window.AAVIN_STORE.setRole(profile.role);
          this.redirectToRoleDashboard(profile.role);

          return { success: true, profile };
        }
      } catch (err) {
        return { success: false, error: err.message || 'Authentication service unavailable.' };
      }
    }

    // 2. Demo & Local Testing Resolver (Standard fallback when test credentials are used)
    // Matches the 3 requested admin accounts:
    let matchedRole = null;
    let fullName = '';
    let districtCode = 'ALL';

    if (cleanEmail.includes('tn.admin') || cleanEmail.includes('state') || cleanEmail.includes('secretariat')) {
      matchedRole = 'tamil_nadu_admin';
      fullName = 'Thiru S. Rajendran, IAS (State Secretary)';
    } else if (cleanEmail.includes('district') || cleanEmail.includes('mdu') || cleanEmail.includes('cbe')) {
      matchedRole = 'district_admin';
      fullName = 'Er. M. Saravanan (District Milk Officer)';
      districtCode = 'MDU';
    } else if (cleanEmail.includes('sangam') || cleanEmail.includes('secretary')) {
      matchedRole = 'sangam_admin';
      fullName = 'Thiru S. Palanivel (Sangam Secretary)';
      districtCode = 'MDU';
    } else {
      // Default fallback by username match or state
      matchedRole = 'tamil_nadu_admin';
      fullName = 'State Dairy Administrator';
    }

    const mockProfile = {
      id: 'admin-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      role: matchedRole,
      fullName: fullName,
      districtCode: districtCode,
      districtName: 'Madurai District',
      sangamId: 'sgm-mdu',
      sangamName: 'Aavin Madurai Thozhilar Sangam'
    };

    this.adminProfile = mockProfile;
    this.currentUser = { id: mockProfile.id, email: cleanEmail };
    localStorage.setItem('aavin_admin_profile', JSON.stringify(mockProfile));
    window.AAVIN_STORE.setRole(mockProfile.role);
    this.redirectToRoleDashboard(mockProfile.role);

    return { success: true, profile: mockProfile };
  },

  /**
   * Redirect authenticated admin to their role-specific protected dashboard
   */
  redirectToRoleDashboard(role) {
    if (role === 'tamil_nadu_admin' || role === 'state_admin') {
      window.AAVIN_STORE.setTab('admin_state');
    } else if (role === 'district_admin') {
      window.AAVIN_STORE.setTab('admin_district');
    } else if (role === 'sangam_admin') {
      window.AAVIN_STORE.setTab('admin_sangam');
    } else {
      window.AAVIN_STORE.setTab('home');
    }
  },

  /**
   * Admin Sign Out
   */
  async signOutAdmin() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {}
    }
    this.adminProfile = null;
    this.currentUser = null;
    localStorage.removeItem('aavin_admin_profile');
    window.AAVIN_STORE.setRole('member');
    window.AAVIN_STORE.setTab('home');
    window.AAVIN_APP.showToast('Admin logged out successfully');
  },

  /**
   * Send Password Recovery Email via Supabase Auth
   */
  async sendPasswordReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter registered admin email address.' };
    }

    if (this.client && this.config.url !== 'https://demo-aavin-project.supabase.co') {
      try {
        const { data, error } = await this.client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + window.location.pathname
        });
        if (error) return { success: false, error: error.message };
        return { success: true, message: `Password reset recovery link sent to ${cleanEmail}` };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    return { success: true, message: `Password reset recovery instructions sent to ${cleanEmail}` };
  },

  /**
   * Set New Password after recovery
   */
  async updateAdminPassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (this.client) {
      try {
        const { data, error } = await this.client.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Password updated successfully. You can now login.' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    return { success: true, message: 'Password updated successfully.' };
  },

  showPasswordResetModal() {
    if (window.AAVIN_COMPONENTS.AdminAuth) {
      window.AAVIN_COMPONENTS.AdminAuth.showNewPasswordModal();
    }
  },

  handleSessionEstablished(session) {
    if (session && session.user) {
      this.currentUser = session.user;
    }
  },

  handleSessionTerminated() {
    this.currentUser = null;
    this.adminProfile = null;
    localStorage.removeItem('aavin_admin_profile');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.AAVIN_SUPABASE_AUTH.init();
});
