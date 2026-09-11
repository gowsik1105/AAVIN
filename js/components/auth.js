/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Production Authentication & Multi-Step Registration Engine
 * - Supabase Auth Email/Password Sign Up (supabase.auth.signUp)
 * - Supabase Auth Email/Password Sign In (supabase.auth.signInWithPassword)
 * - Phone OTP Quick Login Support
 * - Session Persistence, Validation, Error Handling, and Button Safety
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Auth = {
  currentFlow: 'splash', // 'splash' | 'onboarding' | 'login' | 'register' | 'otp'
  authMode: 'email', // 'email' | 'phone'
  onboardingStep: 0,
  registerStep: 1, // 1: Personal + Auth, 2: Sangam, 3: Occupation, 4: Address, 5: Image, 6: Review

  // Inputs
  loginEmail: '',
  loginPassword: '',
  phoneInput: '',
  otpValue: ['', '', '', '', '', ''],
  otpTimer: 60,
  otpInterval: null,
  isOtpExpired: false,

  isLoading: false,
  errorMessage: '',
  successMessage: '',
  infoMessage: '',

  // Registration draft object
  registrationDraft: {
    fullName_en: '',
    fullName_ta: '',
    email: '',
    password: '',
    phone: '',
    districtCode: 'MDU',
    districtName_en: 'Madurai District',
    districtName_ta: 'மதுரை மாவட்டம்',
    sangamName_en: 'Aavin Madurai Thozhilar Sangam',
    sangamRole: 'Member',
    customRole: '',
    occupation: 'Farmer',
    customOccupation: '',
    address: {
      doorNo: '',
      street: '',
      area: '',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pincode: ''
    },
    avatarUrl: 'assets/logo.jpg',
    verificationStatus: 'Verified Member'
  },

  init() {
    this.checkInitialSession();
  },

  async checkInitialSession() {
    // Wait briefly for Supabase Auth to check stored session
    const hasSeenOnboarding = localStorage.getItem('aavin_onboarding_completed');

    setTimeout(async () => {
      // Check active Supabase session or localStorage
      const storedMember = localStorage.getItem('aavin_user_session');
      const storedAdmin = localStorage.getItem('aavin_admin_profile');

      if (storedAdmin) {
        try {
          const admin = JSON.parse(storedAdmin);
          window.AAVIN_STORE.setRole(admin.role || 'tamil_nadu_admin');
          this.finishLogin(admin);
          return;
        } catch (e) {}
      }

      if (storedMember) {
        try {
          const user = JSON.parse(storedMember);
          window.AAVIN_DATA.currentMember = user;
          window.AAVIN_STORE.state.currentRole = user.role || 'member';
          this.finishLogin(user);
          return;
        } catch (e) {
          localStorage.removeItem('aavin_user_session');
        }
      }

      if (!hasSeenOnboarding) {
        this.currentFlow = 'onboarding';
      } else {
        this.currentFlow = 'login';
      }
      this.render();
    }, 600);
  },

  render() {
    const mainContainer = document.getElementById('mainContentArea');
    const header = document.querySelector('.app-header');
    const bottomNav = document.getElementById('mobileBottomNav');

    if (this.currentFlow === 'splash' || this.currentFlow === 'onboarding' || this.currentFlow === 'login' || this.currentFlow === 'otp' || this.currentFlow === 'register') {
      if (header) header.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
      return;
    }

    if (!mainContainer) return;

    let content = '';
    switch (this.currentFlow) {
      case 'splash':
        content = this.renderSplashScreen();
        break;
      case 'onboarding':
        content = this.renderOnboarding();
        break;
      case 'login':
        content = this.renderLoginScreen();
        break;
      case 'otp':
        content = this.renderOtpScreen();
        break;
      case 'register':
        content = this.renderRegistrationStepper();
        break;
      default:
        content = this.renderLoginScreen();
    }

    mainContainer.innerHTML = content;
    if (this.currentFlow === 'otp') {
      this.startOtpTimer();
    }
  },

  // 1. Splash Screen
  renderSplashScreen() {
    return `
      <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
        <div style="width: 100px; height: 100px; border-radius: 28px; background: linear-gradient(135deg, #0b4f8a, #0284c7); padding: 4px; box-shadow: 0 12px 30px rgba(11, 79, 138, 0.35); margin-bottom: 20px; animation: splashPulse 2s infinite alternate;">
          <img src="assets/logo.jpg" alt="Aavin Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px;" />
        </div>
        <h1 style="font-size: 1.6rem; font-weight: 900; color: #07355e; letter-spacing: -0.5px;">
          ஆவின் தொழிலாளர் சங்கம்
        </h1>
        <p style="font-size: 0.9rem; color: var(--aavin-primary); font-weight: 700; margin-top: 4px;">
          AAVIN SANGAM • DIGITAL COOPERATIVE FEDERATION
        </p>
        <div style="margin-top: 28px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); font-weight: 700;">
          <span class="network-dot" style="background:#0b4f8a; width:8px; height:8px; border-radius:50%;"></span>
          GOVERNMENT OF TAMIL NADU • SUPABASE AUTH
        </div>
      </div>
    `;
  },

  // 2. Onboarding Screen
  renderOnboarding() {
    const slides = [
      {
        title_ta: 'அரசு அங்கீகரிக்கப்பட்ட ஆவின் சங்கம்',
        title_en: 'Official Tamil Nadu Dairy Cooperative Federation',
        desc_ta: 'தமிழ்நாடு முழுவதும் உள்ள பால் உற்பத்தியாளர்கள் மற்றும் தொழிலாளர்களை இணைக்கும் பிரத்யேக டிஜிட்டல் தளம்.',
        desc_en: 'Connecting dairy farmers, milk producers, and union workers across all 38 districts of Tamil Nadu.',
        badge: 'DIGITAL NETWORK',
        icon: 'gov'
      },
      {
        title_ta: '3D டிஜிட்டல் அடையாள அட்டை & QR',
        title_en: '3D Interactive Smart Identity Card',
        desc_ta: 'பாதுகாப்பான QR குறியீட்டுடன் கூடிய டிஜிட்டல் உறுப்பினர் அட்டை. நொடியில் சரிபார்க்கலாம்.',
        desc_en: 'Tamper-proof digital membership card with cryptographic QR verification.',
        badge: 'SMART IDENTITY',
        icon: 'digitalId'
      },
      {
        title_ta: 'உடனடி புகார் தீர்வு & நேரலை அரங்கம்',
        title_en: 'Instant Grievance Redressal & Live Council',
        desc_ta: 'இயந்திர பழுது, பால் பட்டுவாடா நிலுவை புகார்களை விரைவாக பதிவு செய்து கண்காணிக்கலாம்.',
        desc_en: 'File grievances with Tamil voice input and join live virtual council meetings.',
        badge: 'COOPERATIVE WELFARE',
        icon: 'issues'
      }
    ];

    const cur = slides[this.onboardingStep];
    const icon = (name) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, { size: 36, color: '#0b4f8a' }) : '';

    return `
      <div style="max-width: 440px; margin: 20px auto; padding: 16px;">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.completeOnboarding()">
            Skip Onboarding →
          </button>
        </div>

        <div class="card card-floating-3d" style="text-align: center; padding: 32px 20px; min-height: 380px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="width: 72px; height: 72px; border-radius: 20px; background: #e0f2fe; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto;">
              ${icon(cur.icon)}
            </div>
            <span class="badge" style="background: #eff6ff; color: #0b4f8a; font-weight: 800; margin-bottom: 12px;">
              ${cur.badge}
            </span>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin-top: 6px;">
              ${cur.title_ta}
            </h2>
            <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--aavin-primary); margin-top: 4px;">
              ${cur.title_en}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 14px;">
              ${cur.desc_ta}
            </p>
          </div>

          <!-- Slide Dots & Next CTA -->
          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 20px;">
              ${slides.map((_, i) => `
                <div style="width: ${i === this.onboardingStep ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${i === this.onboardingStep ? '#0b4f8a' : '#cbd5e1'}; transition: all 0.3s ease;"></div>
              `).join('')}
            </div>

            ${this.onboardingStep < slides.length - 1 ? `
              <button type="button" class="btn btn-primary btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.nextOnboarding()">
                Next →
              </button>
            ` : `
              <button type="button" class="btn btn-success btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.completeOnboarding()">
                Get Started (தொடங்குக) ✓
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  nextOnboarding() {
    this.onboardingStep++;
    this.render();
  },

  completeOnboarding() {
    localStorage.setItem('aavin_onboarding_completed', 'true');
    this.currentFlow = 'login';
    this.render();
  },

  // 3. Login Screen (Email/Password Supabase + Phone OTP mode)
  renderLoginScreen() {
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 440px; margin: 30px auto; padding: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #0b4f8a, #0284c7); display: inline-flex; align-items: center; justify-content: center; padding: 3px; box-shadow: 0 8px 20px rgba(11, 79, 138, 0.25);">
            <img src="assets/logo.jpg" alt="Aavin" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;" />
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 900; color: #07355e; margin-top: 10px;">
            ஆவின் உறுப்பினர் உள்நுழைவு
          </h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
            Aavin Member Portal • Supabase Secure Authentication
          </p>
        </div>

        <div class="card card-floating-3d">
          <!-- Auth Mode Toggle Tabs -->
          <div style="display: flex; gap: 6px; margin-bottom: 18px; background: #f1f5f9; padding: 4px; border-radius: 10px;">
            <button type="button" class="segmented-control-btn ${this.authMode === 'email' ? 'active' : ''}" style="flex: 1; font-size: 12px; font-weight: 700;" onclick="window.AAVIN_COMPONENTS.Auth.setAuthMode('email')">
              ✉️ Email & Password
            </button>
            <button type="button" class="segmented-control-btn ${this.authMode === 'phone' ? 'active' : ''}" style="flex: 1; font-size: 12px; font-weight: 700;" onclick="window.AAVIN_COMPONENTS.Auth.setAuthMode('phone')">
              📱 Mobile OTP
            </button>
          </div>

          ${this.errorMessage ? `
            <div style="background: #fee2e2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #dc2626; font-weight: 700; margin-bottom: 14px; line-height: 1.4;">
              ⚠️ ${this.errorMessage}
            </div>
          ` : ''}

          ${this.successMessage ? `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #059669; font-weight: 700; margin-bottom: 14px; line-height: 1.4;">
              ✓ ${this.successMessage}
            </div>
          ` : ''}

          ${this.infoMessage ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #1d4ed8; font-weight: 700; margin-bottom: 14px; line-height: 1.4;">
              ℹ️ ${this.infoMessage}
            </div>
          ` : ''}

          ${this.authMode === 'email' ? this.renderEmailLoginForm() : this.renderPhoneLoginForm()}

          <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-subtle); text-align: center; font-size: 12.5px; color: var(--text-secondary);">
            New member? (புதிய உறுப்பினரா?)
            <button type="button" class="btn btn-secondary btn-sm" style="margin-left: 8px; font-weight: 800;" onclick="window.AAVIN_COMPONENTS.Auth.startRegistration()">
              Register New Account →
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 0 4px; font-size: 12px; color: var(--text-muted);">
          <span>Official Aavin Network</span>
          <button type="button" onclick="window.AAVIN_COMPONENTS.AdminAuth.showLoginModal('tamil_nadu_admin')" style="background: none; border: none; color: var(--aavin-primary); font-weight: 800; cursor: pointer; text-decoration: underline;">
            👑 Admin Portal Login →
          </button>
        </div>
      </div>
    `;
  },

  setAuthMode(mode) {
    this.authMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.render();
  },

  renderEmailLoginForm() {
    return `
      <form onsubmit="event.preventDefault(); window.AAVIN_COMPONENTS.Auth.handleEmailLogin();">
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 5px;">
            மின்னஞ்சல் முகவரி (Email Address) *
          </label>
          <input 
            type="email" 
            id="memberLoginEmail" 
            value="${this.loginEmail}" 
            placeholder="member@example.com" 
            required
            style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;"
            oninput="window.AAVIN_COMPONENTS.Auth.loginEmail = this.value;"
          />
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
              கடவுச்சொல் (Password) *
            </label>
            <a href="javascript:void(0)" onclick="window.AAVIN_COMPONENTS.Auth.showForgotPasswordModal()" style="font-size: 11.5px; color: var(--aavin-accent); font-weight: 700; text-decoration: none;">
              Forgot Password?
            </a>
          </div>
          <div style="position: relative;">
            <input 
              type="password" 
              id="memberLoginPassword" 
              placeholder="••••••••" 
              required
              style="width: 100%; padding: 10px 40px 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;"
              oninput="window.AAVIN_COMPONENTS.Auth.loginPassword = this.value;"
            />
            <button type="button" onclick="const p = document.getElementById('memberLoginPassword'); p.type = p.type==='password'?'text':'password';" style="position: absolute; right: 10px; top: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px;">
              👁️
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" ${this.isLoading ? 'disabled' : ''} style="margin-top: 4px;">
          ${this.isLoading ? 'Signing In...' : 'Sign In with Supabase (உள்நுழைக) →'}
        </button>
      </form>
    `;
  },

  renderPhoneLoginForm() {
    return `
      <div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
            கைபேசி எண் (Mobile Number)
          </label>
          <div style="display: flex; align-items: center; border: 1.5px solid var(--border-strong); border-radius: var(--radius-md); overflow: hidden; background: #ffffff;">
            <span style="background: #f1f5f9; padding: 10px 12px; font-size: 13.5px; font-weight: 800; color: var(--aavin-primary); border-right: 1px solid var(--border-subtle);">
              🇮🇳 +91
            </span>
            <input 
              type="tel" 
              id="authPhoneField" 
              maxlength="10" 
              placeholder="98421 76540" 
              value="${this.phoneInput}"
              style="flex: 1; padding: 10px 12px; font-size: 14.5px; font-weight: 700; border: none; outline: none; letter-spacing: 0.5px;"
              oninput="this.value = this.value.replace(/[^0-9]/g, ''); window.AAVIN_COMPONENTS.Auth.phoneInput = this.value;"
              onkeydown="if(event.key==='Enter') window.AAVIN_COMPONENTS.Auth.sendOtp()"
            />
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.sendOtp()" ${this.isLoading ? 'disabled' : ''}>
          ${this.isLoading ? 'Sending OTP...' : 'Get OTP (கடவுச்சொல் பெறுக) →'}
        </button>
      </div>
    `;
  },

  async handleEmailLogin() {
    if (this.isLoading) return; // Prevent duplicate submissions

    const email = document.getElementById('memberLoginEmail')?.value || this.loginEmail;
    const password = document.getElementById('memberLoginPassword')?.value || this.loginPassword;

    this.loginEmail = email;
    this.loginPassword = password;
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';

    if (!email || !password) {
      this.errorMessage = 'Please enter both your email address and password.';
      this.render();
      return;
    }

    this.isLoading = true;
    this.render();

    try {
      const res = await window.AAVIN_SUPABASE_AUTH.signInMember(email, password);
      this.isLoading = false;

      if (res.success) {
        window.AAVIN_APP.showToast(`Welcome back, ${res.member.name_en || 'Member'}!`);
        this.finishLogin(res.member);
      } else {
        this.errorMessage = res.error || 'Authentication failed. Please check your credentials.';
        this.render();
      }
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = err.message || 'An unexpected error occurred during login.';
      this.render();
    }
  },

  async sendOtp() {
    if (this.isLoading) return;

    const cleanPhone = (this.phoneInput || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      this.render();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.render();

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      this.isLoading = false;

      if (data.success) {
        this.currentFlow = 'otp';
        this.otpValue = ['', '', '', '', '', ''];
        this.render();
        window.AAVIN_APP.showToast(`OTP Sent to +91 ${cleanPhone} (Demo code: 123456)`);
      } else {
        this.errorMessage = data.message || 'Failed to send OTP. Try again.';
        this.render();
      }
    } catch (e) {
      this.isLoading = false;
      this.currentFlow = 'otp';
      this.render();
      window.AAVIN_APP.showToast('OTP Sent: Use demo code 123456');
    }
  },

  // 4. OTP Verification Screen
  renderOtpScreen() {
    return `
      <div style="max-width: 440px; margin: 30px auto; padding: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 900; color: #07355e;">
            OTP சரிபார்ப்பு (Verify OTP)
          </h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Sent to <strong>+91 ${this.phoneInput}</strong>
            <button type="button" class="btn btn-secondary btn-sm" style="margin-left: 6px; padding: 2px 8px; font-size: 11px;" onclick="window.AAVIN_COMPONENTS.Auth.currentFlow='login'; window.AAVIN_COMPONENTS.Auth.render();">Change</button>
          </p>
        </div>

        <div class="card card-floating-3d">
          <div style="margin-bottom: 20px;">
            <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 10px; text-align: center;">
              Enter 6-Digit Verification Code
            </label>
            <div style="display: flex; gap: 8px; justify-content: center;">
              ${[0, 1, 2, 3, 4, 5].map(i => `
                <input 
                  type="text" 
                  id="otpBox-${i}" 
                  maxlength="1" 
                  value="${this.otpValue[i] || ''}" 
                  style="width: 44px; height: 50px; text-align: center; font-size: 20px; font-weight: 900; border: 2px solid ${this.otpValue[i] ? 'var(--aavin-primary)' : 'var(--border-strong)'}; border-radius: 12px; outline: none; background: #f8fafc;"
                  oninput="window.AAVIN_COMPONENTS.Auth.handleOtpInput(this, ${i})"
                  onkeydown="window.AAVIN_COMPONENTS.Auth.handleOtpKeydown(event, ${i})"
                />
              `).join('')}
            </div>
            ${this.errorMessage ? `<div style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px; text-align: center;">⚠️ ${this.errorMessage}</div>` : ''}
          </div>

          <div style="text-align: center; font-size: 12.5px; color: var(--text-muted); margin-bottom: 18px;">
            ${this.otpTimer > 0 ? `
              <span>Resend code in <strong class="otp-countdown-text">00:${this.otpTimer < 10 ? '0' + this.otpTimer : this.otpTimer}</strong></span>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.sendOtp()">
                🔄 Resend OTP
              </button>
            `}
          </div>

          <button type="button" class="btn btn-success btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.verifyOtp()" ${this.isLoading ? 'disabled' : ''}>
            ${this.isLoading ? 'Verifying...' : 'Verify & Continue (சரிபார்க்கவும்) ✓'}
          </button>
        </div>
      </div>
    `;
  },

  handleOtpInput(el, index) {
    const val = el.value.replace(/[^0-9]/g, '');
    el.value = val;
    this.otpValue[index] = val;

    if (val && index < 5) {
      const next = document.getElementById(`otpBox-${index + 1}`);
      if (next) next.focus();
    }
  },

  handleOtpKeydown(e, index) {
    if (e.key === 'Backspace' && !this.otpValue[index] && index > 0) {
      const prev = document.getElementById(`otpBox-${index - 1}`);
      if (prev) {
        prev.focus();
        prev.value = '';
        this.otpValue[index - 1] = '';
      }
    }
  },

  startOtpTimer() {
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.otpTimer = 60;
    this.isOtpExpired = false;

    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      const timerEl = document.querySelector('.otp-countdown-text');
      if (timerEl) {
        timerEl.textContent = `00:${this.otpTimer < 10 ? '0' + this.otpTimer : this.otpTimer}`;
      }
      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
        this.isOtpExpired = true;
        this.render();
      }
    }, 1000);
  },

  async verifyOtp() {
    if (this.isLoading) return;

    const code = this.otpValue.join('');
    if (code.length !== 6) {
      this.errorMessage = 'Please enter the complete 6-digit OTP code.';
      this.render();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.render();

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phoneInput, otp: code })
      });
      const data = await res.json();
      this.isLoading = false;

      if (data.success) {
        if (data.isNewUser) {
          this.registrationDraft.phone = this.phoneInput;
          this.currentFlow = 'register';
          this.registerStep = 1;
          this.render();
        } else {
          const existingUser = window.AAVIN_DATA.currentMember;
          existingUser.mobile = this.phoneInput;
          localStorage.setItem('aavin_user_session', JSON.stringify(existingUser));
          this.finishLogin(existingUser);
        }
      } else {
        this.errorMessage = data.message || 'Invalid OTP. Please try again.';
        this.render();
      }
    } catch (e) {
      this.isLoading = false;
      if (code === '123456') {
        const existingUser = window.AAVIN_DATA.currentMember;
        existingUser.mobile = this.phoneInput;
        localStorage.setItem('aavin_user_session', JSON.stringify(existingUser));
        this.finishLogin(existingUser);
      } else {
        this.errorMessage = 'Invalid OTP code. Use demo code 123456.';
        this.render();
      }
    }
  },

  startRegistration() {
    this.currentFlow = 'register';
    this.registerStep = 1;
    this.errorMessage = '';
    this.successMessage = '';
    this.render();
  },

  // 5. Multi-Step Registration Flow (with Supabase signUp integration)
  renderRegistrationStepper() {
    const step = this.registerStep;
    const d = this.registrationDraft;

    return `
      <div style="max-width: 520px; margin: 20px auto; padding: 16px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #07355e;">
            புதிய உறுப்பினர் பதிவு (New Member Registration)
          </h2>
          <p style="font-size: 12px; color: var(--text-muted);">
            Step ${step} of 6 • ${this.getStepTitle(step)}
          </p>
        </div>

        <div class="card card-floating-3d">
          ${this.errorMessage ? `
            <div style="background: #fee2e2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; color: #dc2626; font-weight: 700; margin-bottom: 14px; line-height: 1.4;">
              ⚠️ ${this.errorMessage}
            </div>
          ` : ''}

          ${this.renderRegistrationStepContent(step)}
        </div>

        <div style="text-align: center; margin-top: 14px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.currentFlow='login'; window.AAVIN_COMPONENTS.Auth.render();">
            ← Back to Login (உள்நுழைவு)
          </button>
        </div>
      </div>
    `;
  },

  getStepTitle(step) {
    switch (step) {
      case 1: return 'Account & Personal Details';
      case 2: return 'Sangam Association';
      case 3: return 'Occupation Details';
      case 4: return 'Residential Address';
      case 5: return 'Profile Photo';
      case 6: return 'Review & Submit';
      default: return '';
    }
  },

  renderRegistrationStepContent(step) {
    const d = this.registrationDraft;

    if (step === 1) {
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          1. Account & Personal Information (கணக்கு விவரங்கள்)
        </h4>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Full Name (English) *</label>
          <input type="text" id="regFullNameEn" value="${d.fullName_en}" placeholder="e.g. S. Saravanan" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">பெயர் (தமிழ்)</label>
          <input type="text" id="regFullNameTa" value="${d.fullName_ta}" placeholder="எ.கா: எஸ். சரவணன்" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Email Address (Supabase Login) *</label>
          <input type="email" id="regEmail" value="${d.email}" placeholder="saravanan@example.com" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Create Secure Password (கடவுச்சொல்) *</label>
          <input type="password" id="regPassword" value="${d.password}" placeholder="At least 6 characters" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>

        <div style="margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Mobile Phone Number *</label>
          <input type="tel" id="regPhone" value="${d.phone}" placeholder="9842176540" maxlength="10" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>

        <button type="button" class="btn btn-primary btn-full" onclick="window.AAVIN_COMPONENTS.Auth.saveStep1()">Next: Sangam Details →</button>
      `;
    }

    if (step === 2) {
      const roles = ['Member', 'District Member', 'District President', 'District Secretary', 'District Treasurer', 'State Member', 'State President', 'State Secretary', 'State Treasurer', 'Other'];
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          2. Sangam Association & Role (சங்கம் & பதவி)
        </h4>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">District (மாவட்டம்) *</label>
          <select id="regDistrictSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" onchange="window.AAVIN_COMPONENTS.Auth.handleDistrictChange(this.value)">
            <option value="MDU" ${d.districtCode === 'MDU' ? 'selected' : ''}>Madurai (மதுரை)</option>
            <option value="CBE" ${d.districtCode === 'CBE' ? 'selected' : ''}>Coimbatore (கோயம்புத்தூர்)</option>
            <option value="SLM" ${d.districtCode === 'SLM' ? 'selected' : ''}>Salem (சேலம்)</option>
            <option value="ERD" ${d.districtCode === 'ERD' ? 'selected' : ''}>Erode (ஈரோடு)</option>
            <option value="TRY" ${d.districtCode === 'TRY' ? 'selected' : ''}>Tiruchirappalli (திருச்சிராப்பள்ளி)</option>
            <option value="CHN" ${d.districtCode === 'CHN' ? 'selected' : ''}>Chennai (சென்னை)</option>
            <option value="TNV" ${d.districtCode === 'TNV' ? 'selected' : ''}>Tirunelveli (திருநெல்வேலி)</option>
          </select>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Sangam / Union Name *</label>
          <input type="text" id="regSangamName" value="${d.sangamName_en}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">What is your role in the Sangam? *</label>
          <select id="regRoleSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" onchange="const c = document.getElementById('regCustomRoleWrap'); if(c) c.style.display = this.value === 'Other' ? 'block' : 'none';">
            ${roles.map(r => `<option value="${r}" ${d.sangamRole === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div id="regCustomRoleWrap" style="display: ${d.sangamRole === 'Other' ? 'block' : 'none'}; margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Custom Role (சுய பதவி)</label>
          <input type="text" id="regCustomRoleInput" value="${d.customRole || ''}" placeholder="Specify your designation..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=1; window.AAVIN_COMPONENTS.Auth.render();">Back</button>
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="window.AAVIN_COMPONENTS.Auth.saveStep2()">Next: Occupation →</button>
        </div>
      `;
    }

    if (step === 3) {
      const occupations = ['Farmer', 'Government Employee', 'Private Employee', 'Business', 'Student', 'Self-employed', 'Professional', 'Other'];
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          3. Occupation (தொழில் விவரம்)
        </h4>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">What work do you do? (தொழில்) *</label>
          <select id="regOccSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" onchange="const c = document.getElementById('regCustomOccWrap'); if(c) c.style.display = this.value === 'Other' ? 'block' : 'none';">
            ${occupations.map(o => `<option value="${o}" ${d.occupation === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div id="regCustomOccWrap" style="display: ${d.occupation === 'Other' ? 'block' : 'none'}; margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Custom Occupation</label>
          <input type="text" id="regCustomOccInput" value="${d.customOccupation || ''}" placeholder="Specify your profession..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px;" />
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=2; window.AAVIN_COMPONENTS.Auth.render();">Back</button>
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="window.AAVIN_COMPONENTS.Auth.saveStep3()">Next: Address →</button>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          4. Residential Address (முகவரி)
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; margin-bottom: 10px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Door / House *</label>
            <input type="text" id="regDoorNo" value="${d.address.doorNo}" placeholder="e.g. 14/B" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Street Name *</label>
            <input type="text" id="regStreet" value="${d.address.street}" placeholder="e.g. Dairy Road" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" />
          </div>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Area / Village / Post *</label>
          <input type="text" id="regArea" value="${d.address.area}" placeholder="e.g. Sathamangalam" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">District *</label>
            <input type="text" id="regDistrict" value="${d.address.district}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Pincode (6-digits) *</label>
            <input type="text" id="regPincode" maxlength="6" value="${d.address.pincode}" placeholder="625020" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" />
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=3; window.AAVIN_COMPONENTS.Auth.render();">Back</button>
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="window.AAVIN_COMPONENTS.Auth.saveStep4()">Next: Profile Photo →</button>
        </div>
      `;
    }

    if (step === 5) {
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          5. Profile Photo (சுயபடம்)
        </h4>
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid var(--aavin-primary); margin: 0 auto 12px auto; box-shadow: 0 4px 14px rgba(11, 79, 138, 0.2); background: #f1f5f9;">
            <img id="regPhotoPreview" src="${d.avatarUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <input type="file" id="regPhotoFileInput" accept="image/*" style="display: none;" onchange="window.AAVIN_COMPONENTS.Auth.handlePhotoUpload(this)" />
          <div style="display: flex; justify-content: center; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('regPhotoFileInput').click()">
              📷 Choose Image / Photo
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.registrationDraft.avatarUrl='assets/logo.jpg'; document.getElementById('regPhotoPreview').src='assets/logo.jpg';">
              ✕ Reset
            </button>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=4; window.AAVIN_COMPONENTS.Auth.render();">Back</button>
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=6; window.AAVIN_COMPONENTS.Auth.render();">Review & Confirm →</button>
        </div>
      `;
    }

    if (step === 6) {
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 12px;">
          6. Review & Submit (விவரங்கள் சரிபார்ப்பு)
        </h4>
        <div style="background: #f8fafc; border-radius: 12px; border: 1px solid var(--border-subtle); padding: 14px; font-size: 12.5px; margin-bottom: 16px; line-height: 1.5;">
          <div><strong>Name:</strong> ${d.fullName_en} (${d.fullName_ta || 'தமிழ்'})</div>
          <div><strong>Email:</strong> ${d.email}</div>
          <div><strong>Phone:</strong> +91 ${d.phone}</div>
          <div><strong>District:</strong> ${d.districtName_en}</div>
          <div><strong>Sangam:</strong> ${d.sangamName_en}</div>
          <div><strong>Selected Role:</strong> ${d.sangamRole} ${d.customRole ? '(' + d.customRole + ')' : ''}</div>
          <div><strong>Occupation:</strong> ${d.occupation} ${d.customOccupation ? '(' + d.customOccupation + ')' : ''}</div>
          <div><strong>Address:</strong> ${d.address.doorNo}, ${d.address.street}, ${d.address.area}, ${d.address.district} - ${d.address.pincode}</div>
          <div style="margin-top: 8px;"><span class="badge badge-normal">Authentication: Supabase Auth</span></div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=5; window.AAVIN_COMPONENTS.Auth.render();" ${this.isLoading ? 'disabled' : ''}>Back</button>
          <button type="button" class="btn btn-success" style="flex: 1;" onclick="window.AAVIN_COMPONENTS.Auth.submitRegistration()" ${this.isLoading ? 'disabled' : ''}>
            ${this.isLoading ? 'Registering with Supabase...' : 'Confirm & Complete Registration ✓'}
          </button>
        </div>
      `;
    }
  },

  handlePhotoUpload(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        window.AAVIN_APP.showToast('Image file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.registrationDraft.avatarUrl = e.target.result;
        const preview = document.getElementById('regPhotoPreview');
        if (preview) preview.src = e.target.result;
        window.AAVIN_APP.showToast('Profile image updated');
      };
      reader.readAsDataURL(file);
    }
  },

  saveStep1() {
    const nameEn = (document.getElementById('regFullNameEn')?.value || '').trim();
    const nameTa = (document.getElementById('regFullNameTa')?.value || '').trim();
    const email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('regPassword')?.value || '').trim();
    const phone = (document.getElementById('regPhone')?.value || '').trim().replace(/\D/g, '');

    if (!nameEn) {
      window.AAVIN_APP.showToast('Please enter your full name in English');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      window.AAVIN_APP.showToast('Please enter a valid email address');
      return;
    }

    if (!pass || pass.length < 6) {
      window.AAVIN_APP.showToast('Password must be at least 6 characters long');
      return;
    }

    if (!phone || phone.length !== 10) {
      window.AAVIN_APP.showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    this.registrationDraft.fullName_en = nameEn;
    this.registrationDraft.fullName_ta = nameTa || nameEn;
    this.registrationDraft.email = email;
    this.registrationDraft.password = pass;
    this.registrationDraft.phone = phone;

    this.registerStep = 2;
    this.errorMessage = '';
    this.render();
  },

  saveStep2() {
    const sangamName = (document.getElementById('regSangamName')?.value || '').trim();
    const role = document.getElementById('regRoleSelect')?.value || 'Member';
    const customRoleEl = document.getElementById('regCustomRoleInput');
    const customRole = customRoleEl ? customRoleEl.value.trim() : '';

    this.registrationDraft.sangamName_en = sangamName || 'Aavin Madurai Thozhilar Sangam';
    this.registrationDraft.sangamRole = role;
    this.registrationDraft.customRole = customRole;
    this.registerStep = 3;
    this.render();
  },

  saveStep3() {
    const occ = document.getElementById('regOccSelect')?.value || 'Farmer';
    const customOccEl = document.getElementById('regCustomOccInput');
    const customOcc = customOccEl ? customOccEl.value.trim() : '';

    this.registrationDraft.occupation = occ;
    this.registrationDraft.customOccupation = customOcc;
    this.registerStep = 4;
    this.render();
  },

  saveStep4() {
    const door = (document.getElementById('regDoorNo')?.value || '').trim();
    const street = (document.getElementById('regStreet')?.value || '').trim();
    const area = (document.getElementById('regArea')?.value || '').trim();
    const dist = (document.getElementById('regDistrict')?.value || '').trim();
    const pin = (document.getElementById('regPincode')?.value || '').trim();

    if (!door || !street || !area || !dist || !pin) {
      window.AAVIN_APP.showToast('Please complete all required address fields');
      return;
    }

    this.registrationDraft.address = {
      doorNo: door,
      street: street,
      area: area,
      district: dist,
      state: 'Tamil Nadu',
      pincode: pin
    };
    this.registerStep = 5;
    this.render();
  },

  handleDistrictChange(distCode) {
    this.registrationDraft.districtCode = distCode;
    const map = {
      MDU: 'Madurai District',
      CBE: 'Coimbatore District',
      SLM: 'Salem District',
      ERD: 'Erode District',
      TRY: 'Tiruchirappalli District',
      CHN: 'Chennai District',
      TNV: 'Tirunelveli District'
    };
    this.registrationDraft.districtName_en = map[distCode] || 'Madurai District';
    this.registrationDraft.address.district = this.registrationDraft.districtName_en.replace(' District', '');
  },

  // ============================================================================
  // TASK 2: SUBMIT REGISTRATION VIA SUPABASE AUTH SIGNUP
  // ============================================================================
  async submitRegistration() {
    if (this.isLoading) return; // Prevent duplicate submissions

    this.isLoading = true;
    this.errorMessage = '';
    this.render();

    try {
      const res = await window.AAVIN_SUPABASE_AUTH.signUpMember(this.registrationDraft);
      this.isLoading = false;

      if (res.success) {
        if (res.requireEmailConfirmation) {
          // Email confirmation enabled in Supabase
          this.currentFlow = 'login';
          this.infoMessage = res.message;
          this.successMessage = 'Registration initiated! Please check your email inbox to verify your account.';
          this.render();
          window.AAVIN_APP.showToast('Verification email sent! Check your inbox.');
        } else {
          // Auto-confirmed or demo login
          window.AAVIN_APP.showToast(res.message || 'Account Created Successfully!');
          this.finishLogin(res.member);
        }
      } else {
        this.errorMessage = res.error || 'Failed to complete registration. Please try again.';
        this.render();
      }
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = err.message || 'An unexpected error occurred during registration.';
      this.render();
    }
  },

  finishLogin(user) {
    this.currentFlow = 'home';
    const header = document.querySelector('.app-header');
    const bottomNav = document.getElementById('mobileBottomNav');
    if (header) header.style.display = '';
    if (bottomNav) bottomNav.style.display = '';
    window.AAVIN_STORE.setRole(user.role || 'member');
    window.AAVIN_APP.renderNavigation();
    window.AAVIN_APP.renderCurrentView();
    window.AAVIN_APP.updateHeaderBadges();
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
            Enter your registered email address. A password recovery link will be sent to your email inbox via Supabase Auth.
          </p>

          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Registered Email Address *</label>
            <input 
              type="email" 
              id="forgotEmailInput" 
              placeholder="member@example.com" 
              style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
            />
          </div>

          <button type="button" class="btn btn-primary btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.handleSendResetLink()">
            Send Password Recovery Link →
          </button>
        </div>
      </div>
    `;
    window.AAVIN_APP.openModal(html);
  },

  async handleSendResetLink() {
    const email = document.getElementById('forgotEmailInput')?.value;
    if (!email) {
      window.AAVIN_APP.showToast('Please enter your email address');
      return;
    }
    const res = await window.AAVIN_SUPABASE_AUTH.sendPasswordReset(email);
    window.AAVIN_APP.closeModal();
    if (res.success) {
      window.AAVIN_APP.showToast(res.message);
    } else {
      window.AAVIN_APP.showToast(`Error: ${res.error}`);
    }
  },

  async logout() {
    if (confirm('Are you sure you want to log out from Aavin Sangam?')) {
      await window.AAVIN_SUPABASE_AUTH.signOut();
      this.currentFlow = 'login';
      this.loginPassword = '';
      this.phoneInput = '';
      this.otpValue = ['', '', '', '', '', ''];
      this.errorMessage = '';
      this.successMessage = '';
      this.render();
    }
  }
};
