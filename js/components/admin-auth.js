/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Secure Supabase Admin Login Modal & Password Recovery Dialogs
 * STRICT 3-ADMIN ACCOUNTS ONLY:
 * 1. Tamil Nadu Admin -> gowsik1105@gmail.com
 * 2. District Admin   -> aavindis@admin.com
 * 3. Sangam Admin     -> aavinsangam@admin.com
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.AdminAuth = {
  isLoading: false,
  errorMessage: '',
  enteredEmail: '',
  isUnconfirmedEmail: false,

  showLoginModal(targetRole = null, keepError = false) {
    if (!keepError) {
      this.errorMessage = '';
      this.isUnconfirmedEmail = false;
    }
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    let roleTitle = 'Aavin Admin Portal';
    let roleSubtitle = 'Official Approved Administrator Access';
    if (targetRole === 'tamil_nadu_admin' || targetRole === 'state_admin') {
      roleTitle = 'Tamil Nadu State Admin Portal';
      roleSubtitle = 'State Headquarters Access';
    } else if (targetRole === 'district_admin') {
      roleTitle = 'District Admin Portal';
      roleSubtitle = 'District Operations & Processing Plants';
    } else if (targetRole === 'sangam_admin') {
      roleTitle = 'Sangam Admin Portal';
      roleSubtitle = 'Primary Cooperative Sangam Administration';
    }

    const html = `
      <div class="modal-dialog" style="max-width: 460px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #07355e; color: white; display: flex; align-items: center; justify-content: center;">
              ${icon('gov', { size: 18, color: '#ffffff' })}
            </div>
            <div>
              <h3 style="font-size: 15px; color: #07355e; font-weight: 800;">${roleTitle}</h3>
              <div style="font-size: 11px; color: var(--text-muted);">${roleSubtitle}</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          ${this.errorMessage ? `
            <div style="background: #fee2e2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #dc2626; font-weight: 700; margin-bottom: 14px; line-height: 1.4;">
              ⚠️ ${this.errorMessage}
              ${this.isUnconfirmedEmail ? `
                <div style="margin-top: 8px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.AAVIN_COMPONENTS.AdminAuth.handleResendConfirmation()" style="font-size: 11.5px; font-weight: 700; background: #ffffff;">
                    📩 Resend Verification Link to Inbox
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <form onsubmit="event.preventDefault(); window.AAVIN_COMPONENTS.AdminAuth.handleLoginSubmit();">
            <!-- Email Input -->
            <div style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
                Admin Email Address (நிர்வாக மின்னஞ்சல்) *
              </label>
              <input 
                type="email" 
                id="adminAuthEmail" 
                value="${this.enteredEmail || ''}" 
                placeholder="e.g. gowsik1105@gmail.com, aavindis@admin.com..." 
                required
                autocomplete="username"
                style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
                oninput="window.AAVIN_COMPONENTS.AdminAuth.enteredEmail = this.value;"
              />
            </div>

            <!-- Password Input -->
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
                  Password (கடவுச்சொல்) *
                </label>
                <a href="javascript:void(0)" onclick="window.AAVIN_COMPONENTS.AdminAuth.showForgotPasswordModal()" style="font-size: 11.5px; color: var(--aavin-accent); font-weight: 700; text-decoration: none;">
                  Forgot Password?
                </a>
              </div>
              <div style="position: relative;">
                <input 
                  type="password" 
                  id="adminAuthPassword" 
                  placeholder="Enter your admin password" 
                  required
                  autocomplete="current-password"
                  style="width: 100%; padding: 10px 40px 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
                />
                <button type="button" onclick="const p = document.getElementById('adminAuthPassword'); p.type = p.type==='password'?'text':'password';" style="position: absolute; right: 10px; top: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px;">
                  👁️
                </button>
              </div>
            </div>

            <!-- Submit CTA -->
            <button type="submit" class="btn btn-primary btn-full btn-lg" ${this.isLoading ? 'disabled' : ''} style="margin-top: 6px;">
              ${icon('shieldCheck', { size: 16, color: '#ffffff' })}
              <span>${this.isLoading ? 'Authenticating with Supabase...' : 'Sign In to Admin Dashboard →'}</span>
            </button>
          </form>

          <div style="margin-top: 14px; text-align: center; font-size: 11.5px; color: var(--text-muted); line-height: 1.4;">
            🔒 Authenticated securely via Supabase Auth & PostgreSQL Row Level Security (RLS).
          </div>
        </div>
      </div>
    `;

    window.AAVIN_APP.openModal(html);
  },

  async handleLoginSubmit() {
    if (this.isLoading) return;

    const email = (document.getElementById('adminAuthEmail')?.value || this.enteredEmail || '').trim();
    const pass = document.getElementById('adminAuthPassword')?.value || '';

    this.enteredEmail = email;

    if (!email || !pass) {
      this.errorMessage = 'Please enter both your admin email and password.';
      this.showLoginModal(null, true);
      return;
    }

    this.isLoading = true;
    this.showLoginModal(null, true);

    try {
      if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.ensureReady === 'function') {
        await window.AAVIN_SUPABASE_AUTH.ensureReady();
      }
      const res = await window.AAVIN_SUPABASE_AUTH.signInAdmin(email, pass);
      this.isLoading = false;

      if (res.success) {
        this.enteredEmail = '';
        this.errorMessage = '';
        this.isUnconfirmedEmail = false;
        window.AAVIN_APP.closeModal();

        if (res.requireInactivityOtp) {
          window.AAVIN_SUPABASE_AUTH.showInactivityOtpModal(res);
        } else {
          if (window.AAVIN_COMPONENTS && window.AAVIN_COMPONENTS.Auth) {
            window.AAVIN_COMPONENTS.Auth.currentFlow = 'home';
          }
          const header = document.querySelector('.app-header');
          const bottomNav = document.getElementById('mobileBottomNav');
          if (header) header.style.display = '';
          if (bottomNav) bottomNav.style.display = '';

          window.AAVIN_APP.renderNavigation();
          window.AAVIN_APP.renderCurrentView();
          window.AAVIN_APP.updateHeaderBadges();
          window.AAVIN_APP.showToast(`Logged in as ${res.profile?.fullName || 'Admin'} (${res.profile?.role || 'admin'})`);
        }
      } else {
        this.errorMessage = res.error || 'Authentication failed. Please check your credentials.';
        this.isUnconfirmedEmail = Boolean(res.isUnconfirmed);
        this.showLoginModal(null, true);
      }
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = err.message || 'Authentication failed. Please try again.';
      this.isUnconfirmedEmail = false;
      this.showLoginModal(null, true);
    }
  },

  async handleResendConfirmation() {
    const email = (document.getElementById('adminAuthEmail')?.value || this.enteredEmail || '').trim();
    if (!email) {
      if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
        window.AAVIN_APP.showToast('Please enter your admin email address.');
      }
      return;
    }

    const res = await window.AAVIN_SUPABASE_AUTH.resendConfirmationEmail(email);
    if (res.success) {
      if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
        window.AAVIN_APP.showToast(res.message || 'Verification link resent to your email.');
      }
    } else {
      if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
        window.AAVIN_APP.showToast(`Error: ${res.error}`);
      }
    }
  },

  showForgotPasswordModal() {
    const html = `
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="font-size: 15px; color: var(--aavin-primary); font-weight: 800;">
            🔑 Password Reset Recovery
          </h3>
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">
            Enter your approved admin email address. A secure recovery link will be sent via Supabase Auth to reset your password.
          </p>

          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Admin Email Address</label>
            <input type="email" id="forgotPassEmail" placeholder="admin@example.com" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
          </div>

          <button type="button" class="btn btn-primary btn-full" onclick="window.AAVIN_COMPONENTS.AdminAuth.handleForgotSubmit()">
            Send Password Recovery Link →
          </button>

          <div style="margin-top: 14px; text-align: center;">
            <a href="javascript:void(0)" onclick="window.AAVIN_COMPONENTS.AdminAuth.showLoginModal()" style="font-size: 12px; color: var(--aavin-primary); font-weight: 700;">
              ← Back to Admin Login
            </a>
          </div>
        </div>
      </div>
    `;
    window.AAVIN_APP.openModal(html);
  },

  async handleForgotSubmit() {
    const email = document.getElementById('forgotPassEmail')?.value;
    const res = await window.AAVIN_SUPABASE_AUTH.sendPasswordReset(email);
    if (res.success) {
      window.AAVIN_APP.closeModal();
      window.AAVIN_APP.showToast(res.message || 'Recovery email sent successfully!');
    } else {
      window.AAVIN_APP.showToast(res.error || 'Failed to send recovery email');
    }
  },

  showNewPasswordModal() {
    const html = `
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="font-size: 15px; color: var(--aavin-primary); font-weight: 800;">
            🔒 Set New Password (புதிய கடவுச்சொல்)
          </h3>
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">
            Your recovery session is verified. Enter your new password below.
          </p>

          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">New Password (min 6 characters) *</label>
            <input type="password" id="newAdminPass" placeholder="Enter new password" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Confirm New Password *</label>
            <input type="password" id="confirmAdminPass" placeholder="Confirm new password" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
          </div>

          <button type="button" class="btn btn-success btn-full" onclick="window.AAVIN_COMPONENTS.AdminAuth.handleNewPasswordSubmit()">
            Update Password & Login ✓
          </button>
        </div>
      </div>
    `;
    window.AAVIN_APP.openModal(html);
  },

  async handleNewPasswordSubmit() {
    const pass = document.getElementById('newAdminPass')?.value;
    const confirm = document.getElementById('confirmAdminPass')?.value;

    if (!pass || pass.length < 6) {
      window.AAVIN_APP.showToast('Password must be at least 6 characters long');
      return;
    }
    if (pass !== confirm) {
      window.AAVIN_APP.showToast('Passwords do not match');
      return;
    }

    const res = await window.AAVIN_SUPABASE_AUTH.updatePassword(pass);
    if (res.success) {
      window.AAVIN_APP.closeModal();
      window.AAVIN_APP.showToast('Password updated! Please log in with your new password.');
      if (window.AAVIN_COMPONENTS && window.AAVIN_COMPONENTS.Auth) {
        window.AAVIN_COMPONENTS.Auth.currentFlow = 'login';
        window.AAVIN_COMPONENTS.Auth.render();
      }
    } else {
      window.AAVIN_APP.showToast(res.error || 'Failed to update password');
    }
  }
};
