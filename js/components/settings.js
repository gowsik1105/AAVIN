/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Settings, Terms & Conditions, and Privacy Policy Controller
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Settings = {
  settingsState: {
    pushNotifications: true,
    smsAlerts: true,
    meetingReminders: true,
    biometricLock: false,
    theme: 'light'
  },

  init() {
    const saved = localStorage.getItem('aavin_user_settings');
    if (saved) {
      try {
        this.settingsState = { ...this.settingsState, ...JSON.parse(saved) };
      } catch (e) { }
    }
  },

  toggleSetting(key) {
    this.settingsState[key] = !this.settingsState[key];
    localStorage.setItem('aavin_user_settings', JSON.stringify(this.settingsState));
    window.AAVIN_APP.showToast(`${key} updated`);
    this.render();
  },

  render() {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const member = window.AAVIN_DATA.currentMember || {
      name_en: 'S. Saravanan',
      memberId: 'TN-MDU-2026-8841',
      mobile: '98421 76540',
      avatarUrl: 'assets/logo.jpg'
    };
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    const s = this.settingsState;

    return `
      <div style="max-width: 680px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 1.35rem; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
            ${icon('settings', { size: 22, color: '#0b4f8a' })}
            <span>${lang === 'ta' ? 'அமைப்புகள்' : 'Settings & Preferences'}</span>
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-muted);">
            Manage your account security, notification alerts, and legal policies
          </p>
        </div>

        <!-- 1. Account Card -->
        <div class="card card-floating-3d" style="margin-bottom: 14px;">
          <div class="card-header">
            <h3 class="card-title">${icon('user', { size: 18, color: '#0b4f8a' })} Account Profile</h3>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('register')">➕ New Registration</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('digital_id')">View ID</button>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 54px; height: 54px; border-radius: 50%; overflow: hidden; border: 2px solid var(--aavin-primary);">
              <img src="${member.avatarUrl || 'assets/logo.jpg'}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <div style="font-weight: 800; font-size: 15px; color: var(--text-primary);">${member.name_en || 'Aavin Member'}</div>
              <div style="font-size: 12px; color: var(--text-muted);">+91 ${member.mobile || '98421 76540'} • ${member.memberId || 'TN-MDU-2026'}</div>
            </div>
          </div>
        </div>

        <!-- 2. Notification Preferences -->
        <div class="card card-floating-3d" style="margin-bottom: 14px;">
          <h3 class="card-title" style="margin-bottom: 12px;">${icon('bell', { size: 18, color: '#0b4f8a' })} Notifications</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">Push Notifications</strong>
                <div style="font-size: 11.5px; color: var(--text-muted);">Receive instant alerts on issue resolution</div>
              </div>
              <input type="checkbox" ${s.pushNotifications ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.Settings.toggleSetting('pushNotifications')" style="width: 20px; height: 20px; cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">SMS Alerts</strong>
                <div style="font-size: 11.5px; color: var(--text-muted);">Important Government Orders via SMS</div>
              </div>
              <input type="checkbox" ${s.smsAlerts ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.Settings.toggleSetting('smsAlerts')" style="width: 20px; height: 20px; cursor: pointer;" />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">Meeting Reminders</strong>
                <div style="font-size: 11.5px; color: var(--text-muted);">30-minute reminder before live council starts</div>
              </div>
              <input type="checkbox" ${s.meetingReminders ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.Settings.toggleSetting('meetingReminders')" style="width: 20px; height: 20px; cursor: pointer;" />
            </div>
          </div>
        </div>

        <!-- 3. Security -->
        <div class="card card-floating-3d" style="margin-bottom: 14px;">
          <h3 class="card-title" style="margin-bottom: 12px;">${icon('shieldCheck', { size: 18, color: '#15803d' })} Security & Access</h3>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 13px; color: var(--text-primary);">Biometric / App PIN Lock</strong>
              <div style="font-size: 11.5px; color: var(--text-muted);">Protect your smart ID with device biometrics</div>
            </div>
            <input type="checkbox" ${s.biometricLock ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.Settings.toggleSetting('biometricLock')" style="width: 20px; height: 20px; cursor: pointer;" />
          </div>
        </div>

        <!-- 4. Legal & Information -->
        <div class="card card-floating-3d" style="margin-bottom: 18px;">
          <h3 class="card-title" style="margin-bottom: 12px;">${icon('fileText', { size: 18, color: '#0b4f8a' })} Legal & About</h3>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="padding: 10px; border-radius: 8px; background: #f8fafc; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="window.AAVIN_APP.navigate('terms')">
              <strong style="font-size: 13px; color: var(--text-primary);">Terms & Conditions (விதிமுறைகள்)</strong>
              <span style="color: var(--text-muted);">→</span>
            </div>
            <div style="padding: 10px; border-radius: 8px; background: #f8fafc; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="window.AAVIN_APP.navigate('privacy')">
              <strong style="font-size: 13px; color: var(--text-primary);">Privacy Policy (தனியுரிமை கொள்கை)</strong>
              <span style="color: var(--text-muted);">→</span>
            </div>
            <div style="padding: 10px; border-radius: 8px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">App Version</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Aavin Thozhilar Sangam v2.4.0 (Production Release)</div>
              </div>
              <span class="badge badge-normal">Official</span>
            </div>
          </div>
        </div>

        <!-- Logout Button -->
        <button type="button" class="btn btn-danger btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.logout()">
          🚪 Log Out (வெளியேறு)
        </button>
      </div>
    `;
  },

  renderTerms() {
    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <button type="button" class="btn btn-secondary btn-sm" style="margin-bottom: 14px;" onclick="window.AAVIN_APP.navigate('settings')">← Back to Settings</button>
        <div class="card card-floating-3d">
          <h2 style="font-size: 1.4rem; color: #07355e; font-weight: 800; margin-bottom: 8px;">Terms & Conditions (விதிமுறைகள்)</h2>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Effective Date: September 2026 • Government of Tamil Nadu</p>
          
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 14px;">
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">1. Introduction & Acceptance</strong>
              <p>Welcome to Aavin Thozhilar Sangam Digital Federation. By accessing and registering on this platform via phone OTP, members and officials agree to adhere to the Tamil Nadu Co-operative Societies Act, 1983 and official guidelines.</p>
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">2. User Responsibilities & Smart ID</strong>
              <p>Your Digital ID and membership QR code are official state-verified credentials. Members are responsible for the authenticity of filed grievances and machinery status reports.</p>
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">3. Grievance Redressal Protocol</strong>
              <p>Issues submitted through this portal undergo a 7-stage review process involving Primary Sangam Secretaries, District HQ Officers, and the State Dairy Development Department.</p>
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">4. Contact & Support</strong>
              <p>For inquiries, contact the Dairy Cooperative Help Desk at 1800-425-4422 or email dairy.support@tn.gov.in.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderPrivacy() {
    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <button type="button" class="btn btn-secondary btn-sm" style="margin-bottom: 14px;" onclick="window.AAVIN_APP.navigate('settings')">← Back to Settings</button>
        <div class="card card-floating-3d">
          <h2 style="font-size: 1.4rem; color: #07355e; font-weight: 800; margin-bottom: 8px;">Privacy Policy (தனியுரிமை கொள்கை)</h2>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Official Government Cooperative Data Protection Statement</p>
          
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 14px;">
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">1. Information We Collect</strong>
              <p>We collect phone numbers verified via secure SMS OTP, member name, Sangam registration details, occupation, residential address, and profile photo for generating verified Digital IDs.</p>
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">2. Purpose & Data Usage</strong>
              <p>Your data is used exclusively to facilitate dairy welfare schemes, resolve equipment breakdown tickets, issue official Government Orders, and verify Sangam assembly votes.</p>
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 14px;">3. Storage & Cryptographic Security</strong>
              <p>Data is stored in state government compliant secure database instances with SHA-256 digital signature hashes. We never share or sell member data to third parties.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
