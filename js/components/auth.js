/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Complete Member Authentication & Multi-Step Registration Engine
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Auth = {
  currentFlow: 'login', // 'splash' | 'onboarding' | 'login' | 'register'
  onboardingStep: 0,
  registerStep: 1, // 1 to 6

  // Login Inputs (Email or Mobile + Password)
  loginIdentifier: '',
  loginPassword: '',

  // Mobile OTP state
  otpPhone: '',
  otpValue: ['', '', '', '', '', ''],
  otpTimer: 60,
  otpInterval: null,
  isPhoneVerified: false,
  isOtpSent: false,
  otpSessionToken: '',
  verificationToken: '',

  // Dedicated Session Persistence Helpers for Vercel Serverless Stateless Verification
  saveOtpSession(email, sessionToken) {
    this.otpSessionToken = sessionToken || '';
    try {
      if (email && sessionToken) {
        sessionStorage.setItem('aavin_registration_otp_session', JSON.stringify({
          email: email.trim().toLowerCase(),
          sessionToken: sessionToken,
          timestamp: Date.now()
        }));
      }
    } catch (e) {}
  },

  getOtpSession(email) {
    if (this.otpSessionToken) {
      return this.otpSessionToken;
    }
    try {
      const stored = sessionStorage.getItem('aavin_registration_otp_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.sessionToken) {
          const targetEmail = (email || this.registrationDraft.email || '').trim().toLowerCase();
          if (!targetEmail || parsed.email === targetEmail) {
            this.otpSessionToken = parsed.sessionToken;
            if (parsed.email && !this.registrationDraft.email) {
              this.registrationDraft.email = parsed.email;
            }
            return parsed.sessionToken;
          }
        }
      }
    } catch (e) {}
    return null;
  },

  saveVerificationToken(email, verificationToken) {
    this.verificationToken = verificationToken || '';
    try {
      if (email && verificationToken) {
        sessionStorage.setItem('aavin_registration_verification_token', JSON.stringify({
          email: email.trim().toLowerCase(),
          verificationToken: verificationToken,
          timestamp: Date.now()
        }));
      }
    } catch (e) {}
  },

  getVerificationToken(email) {
    if (this.verificationToken) {
      return this.verificationToken;
    }
    try {
      const stored = sessionStorage.getItem('aavin_registration_verification_token');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.verificationToken) {
          const targetEmail = (email || this.registrationDraft.email || '').trim().toLowerCase();
          if (!targetEmail || parsed.email === targetEmail) {
            this.verificationToken = parsed.verificationToken;
            return parsed.verificationToken;
          }
        }
      }
    } catch (e) {}
    return null;
  },

  clearOtpSession() {
    this.otpSessionToken = '';
    this.verificationToken = '';
    this.isOtpSent = false;
    this.isEmailVerified = false;
    try {
      sessionStorage.removeItem('aavin_registration_otp_session');
      sessionStorage.removeItem('aavin_registration_verification_token');
    } catch (e) {}
  },

  restoreOtpSession() {
    try {
      const vStored = sessionStorage.getItem('aavin_registration_verification_token');
      if (vStored) {
        const parsed = JSON.parse(vStored);
        if (parsed && parsed.verificationToken && parsed.email) {
          this.registrationDraft.email = parsed.email;
          this.verificationToken = parsed.verificationToken;
          this.isEmailVerified = true;
          this.isOtpSent = true;
          return true;
        }
      }

      const sStored = sessionStorage.getItem('aavin_registration_otp_session');
      if (sStored) {
        const parsed = JSON.parse(sStored);
        if (parsed && parsed.sessionToken && parsed.email) {
          this.registrationDraft.email = parsed.email;
          this.otpSessionToken = parsed.sessionToken;
          this.isOtpSent = true;
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  isLoading: false,
  errorMessage: '',
  successMessage: '',
  infoMessage: '',
  isTamilNameManuallyEdited: false,

  // Registration draft state
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
    // Listen for hash changes like #register
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#register' || window.location.hash.includes('register')) {
        this.resumeOrStartRegistration();
      }
    });

    if (window.location.hash === '#register' || window.location.hash.includes('register') || window.location.search.includes('register')) {
      this.resumeOrStartRegistration();
      return;
    }

    this.checkInitialSession();
  },

  resumeOrStartRegistration() {
    this.currentFlow = 'register';
    const restored = this.restoreOtpSession();
    if (restored) {
      if (this.isEmailVerified) {
        this.registerStep = 2;
      } else {
        this.registerStep = 1;
      }
    } else {
      this.startRegistration();
    }
    this.render();
  },

  async checkInitialSession() {
    if (window.AAVIN_SUPABASE_AUTH && (window.AAVIN_SUPABASE_AUTH.currentUser || window.AAVIN_SUPABASE_AUTH.currentSession)) {
      this.currentFlow = 'home';
      this.render();
      return;
    }

    const savedUser = localStorage.getItem('aavin_user_session');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj && userObj.id) {
          window.AAVIN_DATA.currentMember = userObj;
          this.currentFlow = 'home';
          this.render();
          return;
        }
      } catch (e) {}
    }

    const hasSeenOnboarding = localStorage.getItem('aavin_onboarding_completed');
    if (!hasSeenOnboarding) {
      this.currentFlow = 'onboarding';
    } else {
      this.currentFlow = 'login';
    }
    this.render();
  },

  handleEnglishNameInput(val) {
    this.registrationDraft.fullName_en = val;
    if (!this.isTamilNameManuallyEdited) {
      const translit = window.transliterateEnToTa ? window.transliterateEnToTa(val) : (window.I18N && window.I18N.transliterateEnToTa ? window.I18N.transliterateEnToTa(val) : val);
      this.registrationDraft.fullName_ta = translit;
      const taEl = document.getElementById('regFullNameTa');
      if (taEl) taEl.value = translit;
    }
    if (!val || !val.trim()) {
      this.isTamilNameManuallyEdited = false;
    }
  },

  handleTamilNameManualInput(val) {
    this.isTamilNameManuallyEdited = true;
    this.registrationDraft.fullName_ta = val;
  },

  regenerateTamilName() {
    this.isTamilNameManuallyEdited = false;
    const enVal = (document.getElementById('regFullNameEn')?.value || this.registrationDraft.fullName_en || '').trim();
    const translit = window.transliterateEnToTa ? window.transliterateEnToTa(enVal) : (window.I18N && window.I18N.transliterateEnToTa ? window.I18N.transliterateEnToTa(enVal) : enVal);
    this.registrationDraft.fullName_ta = translit;
    const taEl = document.getElementById('regFullNameTa');
    if (taEl) taEl.value = translit;
    if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
      window.AAVIN_APP.showToast('Tamil name regenerated from English name');
    }
  },

  handleOccupationChange(val) {
    this.registrationDraft.occupation = val;
    const customWrap = document.getElementById('regCustomOccWrap');
    if (customWrap) {
      customWrap.style.display = val === 'Other' ? 'block' : 'none';
    }
  },

  handleRoleSelectChange(role) {
    this.registrationDraft.sangamRole = role;
    const customWrap = document.getElementById('regCustomRoleWrap');
    if (customWrap) {
      customWrap.style.display = role === 'Other' ? 'block' : 'none';
    }
  },

  render() {
    const mainContainer = document.getElementById('mainContentArea');
    const header = document.querySelector('.app-header');
    const bottomNav = document.getElementById('mobileBottomNav');

    if (this.currentFlow === 'register') {
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = 'none';
      if (mainContainer) {
        mainContainer.innerHTML = this.renderRegistrationStepper();
      }
      return;
    }

    const isAuthView = ['splash', 'onboarding', 'login'].includes(this.currentFlow);

    if (isAuthView) {
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
      default:
        content = this.renderLoginScreen();
    }

    mainContainer.innerHTML = content;
    if (this.currentFlow === 'login') {
      this.attachLoginListeners();
    }
  },

  attachLoginListeners() {
    const btnReg = document.getElementById('btnStartNewRegistration');
    if (btnReg) {
      btnReg.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.startRegistration();
      };
    }

    const form = document.getElementById('memberLoginForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.handleMemberLogin();
      };
    }
  },

  // ============================================================================
  // 1. SPLASH SCREEN
  // ============================================================================
  renderSplashScreen() {
    return `
      <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
        <div style="width: 100px; height: 100px; border-radius: 28px; background: linear-gradient(135deg, #0b4f8a, #0284c7); padding: 4px; box-shadow: 0 12px 30px rgba(11, 79, 138, 0.35); margin-bottom: 20px;">
          <img src="assets/logo.jpg" alt="Aavin Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px;" />
        </div>
        <h1 style="font-size: 1.6rem; font-weight: 900; color: #07355e;">
          ஆவின் தொழிலாளர் சங்கம்
        </h1>
        <p style="font-size: 0.9rem; color: var(--aavin-primary); font-weight: 700; margin-top: 4px;">
          AAVIN SANGAM • DIGITAL COOPERATIVE FEDERATION
        </p>
      </div>
    `;
  },

  // ============================================================================
  // 2. ONBOARDING SCREEN
  // ============================================================================
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #0b4f8a, #0284c7); display: flex; align-items: center; justify-content: center;">
              <img src="assets/logo.jpg" alt="Aavin" style="width: 100%; height: 100%; object-fit: cover; border-radius: 7px;" />
            </div>
            <span style="font-size: 13px; font-weight: 800; color: #07355e;">Aavin Sangam</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.completeOnboarding()" style="font-weight: 700;">
            Skip (தவிர்) →
          </button>
        </div>

        <div class="card card-floating-3d" style="text-align: center; padding: 28px 20px; min-height: 380px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="width: 72px; height: 72px; border-radius: 20px; background: #e0f2fe; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
              ${icon(cur.icon)}
            </div>
            <span class="badge" style="background: #eff6ff; color: #0b4f8a; font-weight: 800; margin-bottom: 10px;">
              ${cur.badge}
            </span>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin-top: 6px;">
              ${cur.title_ta}
            </h2>
            <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--aavin-primary); margin-top: 4px;">
              ${cur.title_en}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 12px;">
              ${cur.desc_ta}
            </p>
          </div>

          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 18px;">
              ${slides.map((_, i) => `
                <div style="width: ${i === this.onboardingStep ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${i === this.onboardingStep ? '#0b4f8a' : '#cbd5e1'}; transition: all 0.3s ease;"></div>
              `).join('')}
            </div>

            <button type="button" class="btn btn-primary btn-full btn-lg" onclick="window.AAVIN_COMPONENTS.Auth.nextOnboarding()" style="font-weight: 800; font-size: 15px; margin-bottom: 8px;">
              ${this.onboardingStep < slides.length - 1 ? 'Next (அடுத்து) →' : 'Get Started (தொடங்குக) ✓'}
            </button>

            <button type="button" class="btn btn-secondary btn-full btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.startRegistration()" style="font-weight: 800; color: var(--aavin-primary); background: #f0f7ff; border: 1.5px solid var(--aavin-primary);">
              📝 New Member Registration (புதிய பதிவு) →
            </button>
          </div>
        </div>
      </div>
    `;
  },

  nextOnboarding() {
    if (this.onboardingStep < 2) {
      this.onboardingStep++;
      this.render();
    } else {
      this.completeOnboarding();
    }
  },

  completeOnboarding() {
    localStorage.setItem('aavin_onboarding_completed', 'true');
    this.onboardingStep = 0;
    this.currentFlow = 'login';
    this.render();
  },

  // ============================================================================
  // 3. HOME AUTHENTICATION PAGE (3 Options)
  // ============================================================================
  renderLoginScreen() {
    return `
      <div style="max-width: 440px; margin: 30px auto; padding: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #0b4f8a, #0284c7); display: inline-flex; align-items: center; justify-content: center; padding: 3px; box-shadow: 0 8px 20px rgba(11, 79, 138, 0.25);">
            <img src="assets/logo.jpg" alt="Aavin" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;" />
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 900; color: #07355e; margin-top: 10px;">
            ஆவின் சங்கம் • உறுப்பினர் தளம்
          </h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
            Aavin Member Portal • Secure Supabase Authentication
          </p>
        </div>

        <div class="card card-floating-3d">
          <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #e0f2fe; display: flex; align-items: center; justify-content: center;">
              🔑
            </div>
            <div>
              <h3 style="font-size: 15px; font-weight: 900; color: #07355e; margin: 0;">
                1. 🔑 Member Login (உறுப்பினர் உள்நுழைவு)
              </h3>
              <p style="font-size: 11.5px; color: var(--text-muted); margin: 0;">
                Enter registered Email or 10-digit Mobile Number
              </p>
            </div>
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

          ${this.unconfirmedEmail ? `
            <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 12.5px; color: #92400e;">
              <div style="font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span>✉️</span>
                <span>Email Confirmation Required</span>
              </div>
              <div style="margin-bottom: 8px; line-height: 1.4;">
                Your Supabase account requires email verification before signing in. Please check your inbox at <strong>${this.unconfirmedEmail}</strong>.
              </div>
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                style="font-weight: 800; color: #92400e; border-color: #f59e0b; background: #ffffff;"
                onclick="window.AAVIN_COMPONENTS.Auth.resendSupabaseConfirmation('${this.unconfirmedEmail}')"
                ${this.isLoading ? 'disabled' : ''}
              >
                ${this.isLoading ? 'Sending Link...' : '📩 Resend Supabase Confirmation Link'}
              </button>
            </div>
          ` : ''}

          <!-- Unified Member Login Form -->
          <form id="memberLoginForm" onsubmit="event.preventDefault(); window.AAVIN_COMPONENTS.Auth.handleMemberLogin();">
            <div style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 5px;">
                மின்னஞ்சல் அல்லது கைபேசி எண் (Email or 10-Digit Mobile) *
              </label>
              <input 
                type="text" 
                id="memberLoginIdentifier" 
                value="${this.loginIdentifier}" 
                placeholder="member@example.com or 9842176540" 
                required
                autocomplete="username"
                style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;"
                oninput="window.AAVIN_COMPONENTS.Auth.loginIdentifier = this.value;"
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
                  autocomplete="current-password"
                  style="width: 100%; padding: 10px 40px 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;"
                  oninput="window.AAVIN_COMPONENTS.Auth.loginPassword = this.value;"
                />
                <button type="button" onclick="const p = document.getElementById('memberLoginPassword'); p.type = p.type==='password'?'text':'password';" style="position: absolute; right: 10px; top: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px;">
                  👁️
                </button>
              </div>
            </div>

            <button type="submit" id="btnMemberLogin" class="btn btn-primary btn-full btn-lg" ${this.isLoading ? 'disabled' : ''} style="font-weight: 800;">
              ${this.isLoading ? 'Signing In...' : '🔑 Sign In (உள்நுழைக) →'}
            </button>
          </form>

          <!-- Divider -->
          <div style="display: flex; align-items: center; margin: 20px 0 16px 0;">
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
            <span style="padding: 0 10px; font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              OR
            </span>
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          </div>

          <!-- OPTION 2: New Registration Button -->
          <div style="cursor: pointer;" onclick="window.AAVIN_COMPONENTS.Auth.startRegistration();">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-align: center;">
              New Member? (புதிய உறுப்பினரா?)
            </div>
            <button 
              type="button" 
              id="btnStartNewRegistration" 
              data-action="start-registration"
              class="btn btn-secondary btn-full btn-lg" 
              style="font-weight: 800; border: 1.5px solid var(--aavin-primary); color: var(--aavin-primary); background: #f0f7ff; cursor: pointer; pointer-events: auto; position: relative; z-index: 10; user-select: none;"
              onclick="event.stopPropagation(); window.AAVIN_COMPONENTS.Auth.startRegistration();"
            >
              📝 2. New Registration (புதிய பதிவு) →
            </button>
          </div>
        </div>

        <!-- OPTION 3: Admin Portal Login -->
        <div style="margin-top: 18px; text-align: center;">
          <button 
            type="button" 
            id="btnAdminPortalLogin" 
            onclick="window.AAVIN_COMPONENTS.AdminAuth.showLoginModal()" 
            style="background: #ffffff; border: 1.5px solid #07355e; color: #07355e; font-weight: 800; padding: 10px 18px; border-radius: 10px; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(7, 53, 94, 0.08);"
          >
            <span>👑 3. Admin Portal Login (நிர்வாகி தளம்) →</span>
          </button>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
            Authorized TN State, District & Sangam Administrators
          </div>
        </div>
      </div>
    `;
  },

  async resendSupabaseConfirmation(email) {
    const targetEmail = (email || this.unconfirmedEmail || this.loginIdentifier || '').trim().toLowerCase();
    if (!targetEmail) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.render();

    try {
      if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.ensureReady === 'function') {
        await window.AAVIN_SUPABASE_AUTH.ensureReady();
      }
      const res = await window.AAVIN_SUPABASE_AUTH.resendConfirmationEmail(targetEmail);
      this.isLoading = false;
      if (res.success) {
        this.successMessage = res.message || `Confirmation email resent to ${targetEmail}. Please check your inbox.`;
        this.errorMessage = '';
      } else {
        this.errorMessage = res.error || 'Failed to resend confirmation email.';
      }
      this.render();
    } catch (e) {
      this.isLoading = false;
      this.errorMessage = e.message || 'Error sending confirmation email.';
      this.render();
    }
  },

  async handleMemberLogin() {
    if (this.isLoading) return;

    const idInput = document.getElementById('memberLoginIdentifier');
    const passInput = document.getElementById('memberLoginPassword');
    const id = idInput ? idInput.value : this.loginIdentifier;
    const password = passInput ? passInput.value : this.loginPassword;

    this.loginIdentifier = id;
    this.loginPassword = password;
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.unconfirmedEmail = null;

    if (!id || !password) {
      this.errorMessage = 'Please enter your email or 10-digit mobile number and password.';
      this.render();
      return;
    }

    this.isLoading = true;
    this.render();

    if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.ensureReady === 'function') {
      await window.AAVIN_SUPABASE_AUTH.ensureReady();
    }

    const authService = window.AAVIN_SUPABASE_AUTH;
    if (!authService || typeof authService.signInMember !== 'function') {
      this.isLoading = false;
      this.errorMessage = 'Authentication service is initializing. Please try again.';
      this.render();
      return;
    }

    try {
      const res = await authService.signInMember(id, password);
      this.isLoading = false;

      if (res.success) {
        this.unconfirmedEmail = null;
        this.errorMessage = '';
        if (res.requireInactivityOtp) {
          this.render();
          window.AAVIN_SUPABASE_AUTH.showInactivityOtpModal(res);
        } else {
          this.currentFlow = 'home';
          if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
            window.AAVIN_APP.showToast(`Welcome back, ${res.member?.name_en || res.profile?.fullName || 'Member'}!`);
          }
          if (window.AAVIN_APP) {
            window.AAVIN_APP.renderNavigation();
            window.AAVIN_APP.renderCurrentView();
            window.AAVIN_APP.updateHeaderBadges();
          }
        }
      } else {
        if (res.isUnconfirmed) {
          this.unconfirmedEmail = res.email || id;
          this.errorMessage = ''; // Use the dedicated unconfirmed notification card
        } else {
          this.unconfirmedEmail = null;
          this.errorMessage = res.error || 'Authentication failed. Please verify your credentials.';
        }
        this.render();
      }
    } catch (err) {
      this.isLoading = false;
      this.unconfirmedEmail = null;
      this.errorMessage = err.message || 'An unexpected error occurred during login.';
      this.render();
    }
  },

  // ============================================================================
  // START REGISTRATION (STARTS WITH STEP 1: EMAIL OTP VERIFICATION)
  // ============================================================================
  startRegistration() {
    this.currentFlow = 'register';
    this.registerStep = 1;
    this.isEmailVerified = false;
    this.isOtpSent = false;
    this.isPhoneVerified = true; // Remove any phone verification blocking
    this.isTamilNameManuallyEdited = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.unconfirmedEmail = null;
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.clearOtpSession();

    // Clean reset of draft state
    this.registrationDraft = {
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
        area: 'Cooperative Colony',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: ''
      },
      avatarUrl: 'assets/logo.jpg',
      verificationStatus: 'Verified Member'
    };

    if (window.AAVIN_STORE) {
      window.AAVIN_STORE.state.currentTab = 'register';
    }
    if (window.AAVIN_APP) {
      window.AAVIN_APP.closeModal();
    }
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  cancelRegistration() {
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.clearOtpSession();
    if (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.currentUser) {
      this.currentFlow = 'home';
      window.AAVIN_APP.navigate('home');
    } else {
      this.currentFlow = 'login';
      this.render();
    }
  },

  // ============================================================================
  // 1. EMAIL OTP SENDING & VERIFICATION ENGINE (BREVO SMTP & SUPABASE)
  // ============================================================================
  async sendEmailOtp() {
    if (this.isLoading || this.isSendingOtp) return;

    if (this.isOtpSent && this.otpTimer > 0) {
      this.errorMessage = `Please wait ${this.otpTimer}s before requesting another verification code.`;
      this.render();
      return;
    }

    const emailEl = document.getElementById('regEmailOtpInput');
    const email = (emailEl ? emailEl.value : (this.registrationDraft.email || '')).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.errorMessage = 'Please enter a valid email address to receive your verification code.';
      this.render();
      return;
    }

    if (this.registrationDraft.email && this.registrationDraft.email !== email) {
      this.clearOtpSession();
    }

    this.registrationDraft.email = email;
    this.isLoading = true;
    this.isSendingOtp = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.render();

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      const data = await res.json();
      this.isLoading = false;
      this.isSendingOtp = false;

      if (res.ok && data && data.success) {
        this.isOtpSent = true;
        this.saveOtpSession(email, data.sessionToken || '');
        this.otpTimer = data.cooldownSeconds || 60;
        this.successMessage = data.message || 'Verification email sent. Please check your inbox and spam folder.';
        this.errorMessage = '';

        if (this.otpInterval) clearInterval(this.otpInterval);
        this.otpInterval = setInterval(() => {
          if (this.otpTimer > 0) {
            this.otpTimer--;
            const timerEl = document.getElementById('regOtpTimer');
            if (timerEl) timerEl.textContent = `${this.otpTimer}s`;
            const btnEl = document.getElementById('regSendOtpBtn');
            if (btnEl && this.isOtpSent) {
              btnEl.textContent = `Resend (${this.otpTimer}s)`;
              btnEl.disabled = true;
            }
          } else {
            clearInterval(this.otpInterval);
            const btnEl = document.getElementById('regSendOtpBtn');
            if (btnEl) {
              btnEl.textContent = 'Resend Verification Email';
              btnEl.disabled = false;
            }
          }
        }, 1000);

        this.render();
        setTimeout(() => {
          const codeInput = document.getElementById('regEmailOtpCode');
          if (codeInput) codeInput.focus();
        }, 100);
      } else if (res.status === 429) {
        this.otpTimer = data.cooldownSeconds || 60;
        this.errorMessage = data.message || `Please wait ${this.otpTimer} seconds before requesting another code.`;
        this.render();
      } else {
        this.errorMessage = (data && (data.message || data.error)) || "We couldn't send the verification email right now. Please try again.";
        this.render();
      }
    } catch (err) {
      this.isLoading = false;
      this.isSendingOtp = false;
      this.errorMessage = "We couldn't send the verification email right now. Please try again.";
      this.render();
    }
  },

  async verifyEmailOtp() {
    if (this.isLoading) return;

    const otpInput = document.getElementById('regEmailOtpCode');
    const otp = (otpInput ? otpInput.value : '').replace(/\D/g, '');
    const email = (this.registrationDraft.email || '').trim().toLowerCase();

    if (!otp || otp.length !== 6) {
      this.errorMessage = 'Please enter the complete 6-digit verification code sent to your email.';
      this.render();
      return;
    }

    const sessionToken = this.getOtpSession(email);
    if (!sessionToken) {
      this.errorMessage = 'Please request a new verification code.';
      this.render();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.render();

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: otp,
          sessionToken: sessionToken
        })
      });
      const data = await res.json();
      this.isLoading = false;

      if (res.ok && data && (data.success || data.verified)) {
        if (this.otpInterval) clearInterval(this.otpInterval);
        this.isEmailVerified = true;
        this.saveVerificationToken(email, data.verificationToken || '');
        this.successMessage = 'Email verified successfully! Proceed to personal details.';
        this.registerStep = 2;
        this.errorMessage = '';
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.errorMessage = (data && (data.message || data.error)) || 'Incorrect verification code. Please try again.';
        this.render();
      }
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = 'Network error while verifying code. Please try again.';
      this.render();
    }
  },

  // ============================================================================
  // 3-STEP COMPLETE REGISTRATION STEPPER
  // ============================================================================
  renderRegistrationStepper() {
    const step = this.registerStep || 1;
    const steps = [
      { num: 1, title: '1. Email OTP', titleTa: 'மின்னஞ்சல் சரிபார்ப்பு' },
      { num: 2, title: '2. Personal Info', titleTa: 'தனிநபர் விவரங்கள்' },
      { num: 3, title: '3. Sangam & Occupation', titleTa: 'சங்கம் & தொழில்' }
    ];

    return `
      <div style="max-width: 540px; margin: 16px auto; padding: 12px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0b4f8a, #0284c7); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(11, 79, 138, 0.25);">
              <img src="assets/logo.jpg" alt="Aavin" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9px;" />
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 900; color: #07355e; margin: 0;">
              புதிய உறுப்பினர் பதிவு (New Registration)
            </h2>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
            Aavin Member Registration • ${step === 1 ? 'Step 1: Email Verification' : (step === 2 ? 'Step 2: Personal Details' : 'Step 3: Sangam, Occupation & Address')}
          </p>
        </div>

        <!-- 3-Step Visual Indicator -->
        <div style="display: flex; gap: 6px; margin-bottom: 16px;">
          ${steps.map(s => `
            <div 
              onclick="if(${s.num} < ${step} || (${s.num} === 2 && window.AAVIN_COMPONENTS.Auth.isEmailVerified)){ window.AAVIN_COMPONENTS.Auth.registerStep=${s.num}; window.AAVIN_COMPONENTS.Auth.render(); }"
              style="
                flex: 1; 
                padding: 8px 6px; 
                border-radius: 8px; 
                text-align: center; 
                cursor: ${s.num < step ? 'pointer' : 'default'};
                background: ${s.num === step ? '#0b4f8a' : (s.num < step ? '#f0fdf4' : '#f8fafc')};
                border: 1.5px solid ${s.num === step ? '#0b4f8a' : (s.num < step ? '#86efac' : '#e2e8f0')};
                color: ${s.num === step ? '#ffffff' : (s.num < step ? '#15803d' : '#64748b')};
                transition: all 0.2s ease;
              "
            >
              <div style="font-size: 11.5px; font-weight: 800;">
                ${s.num < step ? '✓ ' : ''}${s.title}
              </div>
              <div style="font-size: 10px; opacity: 0.9; margin-top: 1px;">
                ${s.titleTa}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card card-floating-3d" style="padding: 20px;">
          ${this.errorMessage ? `
            <div style="background: #fee2e2; border: 1.5px solid #fecdd3; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; font-weight: 800; margin-bottom: 16px; line-height: 1.4; display: flex; align-items: center; gap: 8px;">
              <span>⚠️</span>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}

          ${this.successMessage ? `
            <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #059669; font-weight: 800; margin-bottom: 16px; line-height: 1.4; display: flex; align-items: center; gap: 8px;">
              <span>✓</span>
              <span>${this.successMessage}</span>
            </div>
          ` : ''}

          ${this.infoMessage ? `
            <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1d4ed8; font-weight: 800; margin-bottom: 16px; line-height: 1.4; display: flex; align-items: center; gap: 8px;">
              <span>ℹ️</span>
              <span>${this.infoMessage}</span>
            </div>
          ` : ''}

          ${this.renderRegistrationStepContent(step)}
        </div>

        <div style="text-align: center; margin-top: 14px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Auth.cancelRegistration()" style="color: var(--text-secondary);">
            ← Cancel & Return to Login
          </button>
        </div>
      </div>
    `;
  },

  syncStep2DomValues() {
    const nameEn = document.getElementById('regFullNameEn');
    if (nameEn) this.registrationDraft.fullName_en = nameEn.value.trim();

    const nameTa = document.getElementById('regFullNameTa');
    if (nameTa) this.registrationDraft.fullName_ta = nameTa.value.trim();

    const pass = document.getElementById('regPassword');
    if (pass) this.registrationDraft.password = pass.value;

    const phone = document.getElementById('regPhone');
    if (phone) this.registrationDraft.phone = phone.value.replace(/\D/g, '');
  },

  renderRegistrationStepContent(step) {
    const d = this.registrationDraft;

    // STEP 1: Email OTP Verification (Brevo SMTP Engine)
    if (step === 1) {
      const isCooldownActive = this.isOtpSent && this.otpTimer > 0;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 6px;">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
            <span>📧 1. Email Verification (மின்னஞ்சல் சரிபார்ப்பு)</span>
          </h4>
          ${this.isEmailVerified ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid #a7f3d0;">
              ✓ Verified
            </span>
          ` : (this.isOtpSent ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: #fffbeb; color: #b45309; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid #fde68a;">
              ⏳ Verification Pending
            </span>
          ` : '')}
        </div>

        <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">
          Enter your active email address. A 6-digit verification code will be dispatched to your mailbox via Brevo.
        </p>

        <!-- Email Input & Send/Resend Button -->
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
              Email Address (மின்னஞ்சல் முகவரி) *
            </label>
            ${this.isOtpSent && !this.isEmailVerified ? `
              <button 
                type="button" 
                onclick="window.AAVIN_COMPONENTS.Auth.clearOtpSession(); if(window.AAVIN_COMPONENTS.Auth.otpInterval) clearInterval(window.AAVIN_COMPONENTS.Auth.otpInterval); window.AAVIN_COMPONENTS.Auth.render();" 
                style="background: none; border: none; color: var(--aavin-primary); font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: underline;"
              >
                Change Email
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input 
              type="email" 
              id="regEmailOtpInput" 
              value="${d.email || ''}" 
              placeholder="member@example.com" 
              ${(this.isOtpSent && isCooldownActive) || this.isEmailVerified ? 'disabled' : ''}
              style="flex: 1; min-width: 180px; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
              oninput="if(window.AAVIN_COMPONENTS.Auth.registrationDraft.email !== this.value.trim().toLowerCase()){ window.AAVIN_COMPONENTS.Auth.clearOtpSession(); } window.AAVIN_COMPONENTS.Auth.registrationDraft.email = this.value.trim().toLowerCase();"
              onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.AAVIN_COMPONENTS.Auth.sendEmailOtp(); }"
            />
            <button 
              type="button" 
              id="regSendOtpBtn" 
              class="btn btn-primary" 
              onclick="event.preventDefault(); event.stopPropagation(); window.AAVIN_COMPONENTS.Auth.sendEmailOtp();" 
              ${this.isLoading || this.isSendingOtp || isCooldownActive || this.isEmailVerified ? 'disabled' : ''}
              style="font-weight: 800; white-space: nowrap; flex: 0 0 auto; cursor: ${this.isLoading || this.isSendingOtp || isCooldownActive || this.isEmailVerified ? 'not-allowed' : 'pointer'};"
            >
              ${this.isLoading || this.isSendingOtp ? 'Sending...' : (this.isOtpSent ? (isCooldownActive ? `Resend (${this.otpTimer}s)` : 'Resend Verification Email') : 'Send Verification Code →')}
            </button>
          </div>
        </div>

        ${this.isOtpSent && !this.isEmailVerified ? `
          <!-- OTP Code Input Box -->
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--border-subtle);">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
              Enter 6-Digit Verification Code (சரிபார்ப்புக் குறியீடு) *
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
              <input 
                type="text" 
                id="regEmailOtpCode" 
                maxlength="6" 
                placeholder="123456" 
                autocomplete="one-time-code"
                style="flex: 1; min-width: 140px; padding: 10px 12px; border-radius: 8px; border: 2px solid var(--aavin-primary); font-size: 18px; font-weight: 800; letter-spacing: 4px; text-align: center; outline: none;" 
                onkeydown="if(event.key==='Enter'){ event.preventDefault(); window.AAVIN_COMPONENTS.Auth.verifyEmailOtp(); }"
              />
              <button 
                type="button" 
                id="regVerifyOtpBtn" 
                class="btn btn-success" 
                onclick="event.preventDefault(); event.stopPropagation(); window.AAVIN_COMPONENTS.Auth.verifyEmailOtp();" 
                ${this.isLoading ? 'disabled' : ''}
                style="font-weight: 800; white-space: nowrap; padding: 10px 18px; flex: 0 0 auto; cursor: ${this.isLoading ? 'not-allowed' : 'pointer'};"
              >
                ${this.isLoading ? 'Verifying...' : 'Verify Code ✓'}
              </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-muted); flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
              <span>Code expires in 10 minutes</span>
              ${isCooldownActive ? `
                <span>Resend allowed in: <strong id="regOtpTimer" style="color: var(--aavin-primary);">${this.otpTimer}s</strong></span>
              ` : `
                <span style="color: #059669; font-weight: 700;">You can now request a new code</span>
              `}
            </div>

            <!-- Helpful inbox / spam folder note -->
            <div style="font-size: 11.5px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">💡</span>
              <span>Did not receive the email? Please check your <strong>Spam / Junk</strong> folder, or wait for the countdown to click Resend.</span>
            </div>
          </div>
        ` : ''}

        ${this.isEmailVerified ? `
          <div style="margin-top: 18px;">
            <button type="button" class="btn btn-primary btn-full btn-lg" style="font-weight: 800;" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=2; window.AAVIN_COMPONENTS.Auth.render();">
              Continue to Step 2: Personal Details →
            </button>
          </div>
        ` : ''}
      `;
    }

    // STEP 2: Personal Information
    if (step === 2) {
      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
          <span>👤 2. Personal Information (தனிநபர் விவரங்கள்)</span>
        </h4>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #16a34a; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
          <span>✓</span>
          <span>Verified Email: <strong>${d.email}</strong></span>
        </div>

        <!-- Member Photo Upload (புகைப்படம் பதிவேற்றம்) -->
        <div style="display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 1.5px dashed var(--aavin-primary); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="position: relative; width: 68px; height: 68px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0b4f8a; flex-shrink: 0; box-shadow: 0 3px 10px rgba(11,79,138,0.18); background: #ffffff;">
            <img 
              id="regAvatarPreview" 
              src="${d.avatarUrl || 'assets/logo.jpg'}" 
              alt="Photo Preview" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
          </div>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              Member Photo (உறுப்பினர் புகைப்படம்)
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">
              Digital ID அட்டைக்கான புகைப்படம் (JPG, PNG)
            </div>
            <label class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 5px 12px; font-size: 11.5px; font-weight: 700;">
              📷 <span>Upload Photo / படம் பதிவேற்ற</span>
              <input 
                type="file" 
                id="regPhotoInput" 
                accept="image/*" 
                style="display: none;" 
                onchange="window.AAVIN_COMPONENTS.Auth.handlePhotoUpload(event)" 
              />
            </label>
          </div>
        </div>

        <!-- Full Name (English) -->
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
            Full Name (English) *
          </label>
          <input 
            type="text" 
            id="regFullNameEn" 
            value="${d.fullName_en}" 
            placeholder="e.g. S. Saravanan, Karthik, Suryakala" 
            style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
            oninput="window.AAVIN_COMPONENTS.Auth.handleEnglishNameInput(this.value)"
          />
        </div>

        <!-- Tamil Name -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 4px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
              பெயர் (தமிழ் - Tamil Name) *
            </label>
            <button 
              type="button" 
              onclick="window.AAVIN_COMPONENTS.Auth.regenerateTamilName()" 
              style="background: #eff6ff; border: 1px solid #bfdbfe; color: var(--aavin-primary); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; cursor: pointer;"
              title="Re-generate Tamil transliteration from English name"
            >
              🔄 Auto-Transliterate
            </button>
          </div>
          <input 
            type="text" 
            id="regFullNameTa" 
            value="${d.fullName_ta}" 
            placeholder="எ.கா: எஸ். சரவணன், கார்த்திக், சூர்யகலா" 
            style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
            oninput="window.AAVIN_COMPONENTS.Auth.handleTamilNameManualInput(this.value)"
          />
        </div>

        <!-- Mobile Phone Number -->
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
            Mobile Phone Number (கைபேசி எண்) *
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <span style="position: absolute; left: 12px; font-size: 13.5px; font-weight: 700; color: var(--text-muted); pointer-events: none;">+91</span>
            <input 
              type="tel" 
              id="regPhone" 
              value="${d.phone}" 
              placeholder="9842176540" 
              maxlength="10" 
              style="width: 100%; padding: 10px 12px 10px 46px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; font-weight: 700; outline: none;" 
              oninput="this.value = this.value.replace(/[^0-9]/g, ''); window.AAVIN_COMPONENTS.Auth.registrationDraft.phone = this.value;"
            />
          </div>
        </div>

        <!-- Password -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
            Create Password (கடவுச்சொல்) *
          </label>
          <div style="position: relative;">
            <input 
              type="password" 
              id="regPassword" 
              value="${d.password || ''}" 
              placeholder="Enter at least 6 characters" 
              required
              autocomplete="new-password"
              style="width: 100%; padding: 10px 40px 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
              oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.password = this.value;"
            />
            <button type="button" onclick="const p = document.getElementById('regPassword'); p.type = p.type==='password'?'text':'password';" style="position: absolute; right: 10px; top: 10px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px;">
              👁️
            </button>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
            Password must be at least 6 characters long.
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=1; window.AAVIN_COMPONENTS.Auth.render();">
            ← Back to Email
          </button>
          <button type="button" class="btn btn-primary" style="flex: 1; min-width: 180px; font-weight: 800;" onclick="window.AAVIN_COMPONENTS.Auth.saveStep2()">
            Next: Sangam & Occupation →
          </button>
        </div>
      `;
    }

    // STEP 3: Sangam, Occupation & Address
    if (step === 3) {
      const roles = ['Member', 'District Member', 'District President', 'District Secretary', 'District Treasurer', 'State Member', 'State President', 'State Secretary', 'State Treasurer', 'Other'];
      const occupations = [
        { value: 'Farmer', label: 'விவசாயி / பால் உற்பத்தியாளர் (Farmer / Milk Producer)' },
        { value: 'Dairy Farmer', label: 'பால் பண்ணையாளர் (Dairy Farmer)' },
        { value: 'Dairy Plant Operator', label: 'பால் பதப்படுத்தும் பணியாளர் (Dairy Plant Operator)' },
        { value: 'Milk Procurement Assistant', label: 'பால் கொள்முதல் உதவியாளர் (Procurement Assistant)' },
        { value: 'Veterinary Assistant', label: 'கால்நடை உதவியாளர் (Veterinary Assistant)' },
        { value: 'Sangam Staff', label: 'சங்கப் பணியாளர் (Sangam Staff)' },
        { value: 'Government Employee', label: 'அரசு ஊழியர் (Government Employee)' },
        { value: 'Private Employee', label: 'தனியார் ஊழியர் (Private Employee)' },
        { value: 'Business / Self-Employed', label: 'சுயதொழில் / வியாபாரம் (Business / Self-Employed)' },
        { value: 'Other', label: 'மற்றவை (Other - Specify)' }
      ];

      const isCustomOcc = d.occupation === 'Other' || (d.occupation && !occupations.some(o => o.value === d.occupation));

      return `
        <h4 style="font-size: 14.5px; font-weight: 800; color: var(--aavin-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
          <span>🏛️ 3. Sangam, Occupation & Address (சங்கம் & தொழில்)</span>
        </h4>

        <!-- District & Sangam -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">District (மாவட்டம்) *</label>
            <select id="regDistrictSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; background: #ffffff;" onchange="window.AAVIN_COMPONENTS.Auth.handleDistrictChange(this.value)">
              <option value="MDU" ${d.districtCode === 'MDU' ? 'selected' : ''}>Madurai (மதுரை)</option>
              <option value="CBE" ${d.districtCode === 'CBE' ? 'selected' : ''}>Coimbatore (கோயம்புத்தூர்)</option>
              <option value="SLM" ${d.districtCode === 'SLM' ? 'selected' : ''}>Salem (சேலம்)</option>
              <option value="ERD" ${d.districtCode === 'ERD' ? 'selected' : ''}>Erode (ஈரோடு)</option>
              <option value="TRY" ${d.districtCode === 'TRY' ? 'selected' : ''}>Tiruchirappalli (திருச்சிராப்பள்ளி)</option>
              <option value="CHN" ${d.districtCode === 'CHN' ? 'selected' : ''}>Chennai (சென்னை)</option>
              <option value="TNV" ${d.districtCode === 'TNV' ? 'selected' : ''}>Tirunelveli (திருநெல்வேலி)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Sangam Role (பதவி) *</label>
            <select id="regRoleSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; background: #ffffff;" onchange="window.AAVIN_COMPONENTS.Auth.handleRoleSelectChange(this.value)">
              ${roles.map(r => `<option value="${r}" ${d.sangamRole === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Sangam Union Name -->
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Sangam / Union Name *</label>
          <input 
            type="text" 
            id="regSangamName" 
            value="${d.sangamName_en || 'Aavin Madurai Thozhilar Sangam'}" 
            style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
            oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.sangamName_en = this.value;"
          />
        </div>

        <!-- Occupation Selection -->
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Occupation (தொழில்) *</label>
          <select id="regOccSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; background: #ffffff;" onchange="window.AAVIN_COMPONENTS.Auth.handleOccupationChange(this.value)">
            ${occupations.map(o => `<option value="${o.value}" ${d.occupation === o.value || (o.value === 'Other' && isCustomOcc) ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>

        <!-- Custom Occupation Input if Other -->
        <div id="regCustomOccWrap" style="margin-bottom: 12px; display: ${isCustomOcc ? 'block' : 'none'};">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Specify Your Occupation (தொழில் விவரம்) *</label>
          <input 
            type="text" 
            id="regCustomOccupation" 
            value="${d.customOccupation || (isCustomOcc && d.occupation !== 'Other' ? d.occupation : '')}" 
            placeholder="e.g. Dairy Milk Collector, Quality Tester" 
            style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13.5px; outline: none;" 
            oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.customOccupation = this.value;"
          />
        </div>

        <!-- Address Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 8px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Door / House *</label>
            <input 
              type="text" 
              id="regDoorNo" 
              value="${d.address.doorNo || '12/A'}" 
              placeholder="e.g. 12/A" 
              style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" 
              oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.address.doorNo = this.value;"
            />
          </div>
          <div style="grid-column: span 1;">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Street / Area Name *</label>
            <input 
              type="text" 
              id="regStreet" 
              value="${d.address.street || 'Dairy Cooperative Road'}" 
              placeholder="e.g. Dairy Road" 
              style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" 
              oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.address.street = this.value;"
            />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">District / Town *</label>
            <input 
              type="text" 
              id="regDistrict" 
              value="${d.address.district || d.districtName_en.replace(' District', '')}" 
              style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" 
              oninput="window.AAVIN_COMPONENTS.Auth.registrationDraft.address.district = this.value;"
            />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Pincode (6 digits) *</label>
            <input 
              type="text" 
              id="regPincode" 
              maxlength="6" 
              value="${d.address.pincode || '625020'}" 
              placeholder="625020" 
              style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 13px;" 
              oninput="this.value = this.value.replace(/[^0-9]/g, ''); window.AAVIN_COMPONENTS.Auth.registrationDraft.address.pincode = this.value;"
            />
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.Auth.registerStep=2; window.AAVIN_COMPONENTS.Auth.render();" ${this.isLoading || this.isSubmittingReg ? 'disabled' : ''}>
            ← Back
          </button>
          <button 
            type="button" 
            id="btnSubmitRegistration" 
            class="btn btn-success" 
            style="flex: 1; min-width: 200px; font-weight: 800;" 
            onclick="event.preventDefault(); event.stopPropagation(); window.AAVIN_COMPONENTS.Auth.saveStep3AndSubmit();" 
            ${this.isLoading || this.isSubmittingReg ? 'disabled' : ''}
          >
            ${this.isLoading || this.isSubmittingReg ? 'Registering with Supabase...' : '✓ Complete Registration (பதிவை முடிக்கவும்)'}
          </button>
        </div>
      `;
    }
  },

  handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (JPG, PNG, WebP).';
      this.render();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size should be less than 5MB.';
      this.render();
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Compress & resize image to max 400x400 for high performance & clean storage
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        this.registrationDraft.avatarUrl = dataUrl;
        this.errorMessage = '';

        const previewImg = document.getElementById('regAvatarPreview');
        if (previewImg) {
          previewImg.src = dataUrl;
        }
        if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
          window.AAVIN_APP.showToast('Photo uploaded successfully!');
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  },

  syncStep2DomValues() {
    const en = document.getElementById('regFullNameEn')?.value;
    const ta = document.getElementById('regFullNameTa')?.value;
    const phone = document.getElementById('regPhone')?.value;
    const pass = document.getElementById('regPassword')?.value;
    if (en !== undefined) this.registrationDraft.fullName_en = en.trim();
    if (ta !== undefined) this.registrationDraft.fullName_ta = ta.trim();
    if (phone !== undefined) this.registrationDraft.phone = phone.replace(/\D/g, '');
    if (pass !== undefined) this.registrationDraft.password = pass;
  },

  saveStep2() {
    if (!this.isEmailVerified) {
      this.registerStep = 1;
      this.errorMessage = 'Please complete email OTP verification first.';
      this.render();
      return;
    }

    this.syncStep2DomValues();
    const d = this.registrationDraft;

    if (!d.fullName_en) {
      this.errorMessage = 'Please enter your full name in English.';
      this.render();
      return;
    }

    if (!d.fullName_ta) {
      const translit = window.transliterateEnToTa ? window.transliterateEnToTa(d.fullName_en) : (window.I18N && window.I18N.transliterateEnToTa ? window.I18N.transliterateEnToTa(d.fullName_en) : d.fullName_en);
      d.fullName_ta = translit;
    }

    if (!d.phone || d.phone.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile phone number.';
      this.render();
      return;
    }

    if (!d.password || d.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      this.render();
      return;
    }

    this.registerStep = 3;
    this.errorMessage = '';
    this.successMessage = '';
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  saveStep3AndSubmit() {
    // Immediate synchronous lock against double clicks
    if (this.isSubmittingReg || this.isLoading) {
      console.warn('[AAVIN REGISTRATION] Submission already in progress, blocking duplicate invocation.');
      return;
    }

    if (!this.isEmailVerified) {
      this.registerStep = 1;
      this.errorMessage = 'Please complete email OTP verification first.';
      this.render();
      return;
    }

    const d = this.registrationDraft;
    const sangamName = (document.getElementById('regSangamName')?.value || d.sangamName_en || '').trim();
    const role = document.getElementById('regRoleSelect')?.value || d.sangamRole || 'Member';
    let occ = document.getElementById('regOccSelect')?.value || d.occupation || 'Farmer';
    
    if (occ === 'Other') {
      const customOcc = (document.getElementById('regCustomOccupation')?.value || d.customOccupation || '').trim();
      if (customOcc) {
        occ = customOcc;
        d.customOccupation = customOcc;
      }
    }

    const door = (document.getElementById('regDoorNo')?.value || d.address.doorNo || '').trim();
    const street = (document.getElementById('regStreet')?.value || d.address.street || '').trim();
    const dist = (document.getElementById('regDistrict')?.value || d.address.district || d.districtName_en.replace(' District', '')).trim();
    const pin = (document.getElementById('regPincode')?.value || d.address.pincode || '').trim();

    if (!sangamName) {
      this.errorMessage = 'Please enter your Sangam / Union name.';
      this.render();
      return;
    }

    if (!door || !street || !dist) {
      this.errorMessage = 'Please enter complete address details (Door No, Street & District).';
      this.render();
      return;
    }

    if (!pin || pin.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit postal pincode.';
      this.render();
      return;
    }

    d.sangamName_en = sangamName;
    d.sangamRole = role;
    d.occupation = occ;
    d.address = {
      doorNo: door,
      street: street,
      area: 'Cooperative Colony',
      district: dist,
      state: 'Tamil Nadu',
      pincode: pin
    };

    // Lock UI immediately in DOM
    const submitBtn = document.getElementById('btnSubmitRegistration');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering with Supabase...';
    }

    this.submitRegistration();
  },

  handleDistrictChange(distCode) {
    this.registrationDraft.districtCode = distCode;
    const map = {
      MDU: { en: 'Madurai District', ta: 'மதுரை மாவட்டம்', sangam: 'Aavin Madurai Thozhilar Sangam' },
      CBE: { en: 'Coimbatore District', ta: 'கோயம்புத்தூர் மாவட்டம்', sangam: 'Aavin Coimbatore Thozhilar Sangam' },
      SLM: { en: 'Salem District', ta: 'சேலம் மாவட்டம்', sangam: 'Aavin Salem Thozhilar Sangam' },
      ERD: { en: 'Erode District', ta: 'ஈரோடு மாவட்டம்', sangam: 'Aavin Erode Thozhilar Sangam' },
      TRY: { en: 'Tiruchirappalli District', ta: 'திருச்சிராப்பள்ளி மாவட்டம்', sangam: 'Aavin Tiruchirappalli Thozhilar Sangam' },
      CHN: { en: 'Chennai District', ta: 'சென்னை மாவட்டம்', sangam: 'Aavin Chennai Thozhilar Sangam' },
      TNV: { en: 'Tirunelveli District', ta: 'திருநெல்வேலி மாவட்டம்', sangam: 'Aavin Tirunelveli Thozhilar Sangam' }
    };
    const info = map[distCode] || map.MDU;
    this.registrationDraft.districtName_en = info.en;
    this.registrationDraft.districtName_ta = info.ta;
    this.registrationDraft.sangamName_en = info.sangam;
    this.registrationDraft.address.district = info.en.replace(' District', '');

    const sangamInput = document.getElementById('regSangamName');
    if (sangamInput) {
      sangamInput.value = info.sangam;
    }
  },

  async submitRegistration() {
    if (!this.isEmailVerified) {
      this.registerStep = 1;
      this.errorMessage = 'Please complete email OTP verification first.';
      this.isSubmittingReg = false;
      this.isLoading = false;
      this.render();
      return;
    }

    if (this.isSubmittingReg && this.isLoading) {
      console.warn('[AAVIN REGISTRATION] Registration submission already in progress, blocking duplicate request.');
      return;
    }

    this.isSubmittingReg = true;
    this.isLoading = true;
    this.errorMessage = '';
    this.render();

    try {
      if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.ensureReady === 'function') {
        await window.AAVIN_SUPABASE_AUTH.ensureReady();
      }

      console.log('[AAVIN REGISTRATION] [API REQUEST] POST /api/auth/register-member for email:', this.registrationDraft.email);

      // 1. Call Secure Server-Side Registration Gateway
      const payload = {
        email: this.registrationDraft.email,
        password: this.registrationDraft.password,
        otpVerificationToken: this.getVerificationToken(this.registrationDraft.email) || this.verificationToken || '',
        full_name: this.registrationDraft.fullName_en,
        full_name_ta: this.registrationDraft.fullName_ta,
        phone: this.registrationDraft.phone,
        address: this.registrationDraft.address,
        district_code: this.registrationDraft.districtCode,
        district_name: this.registrationDraft.districtName_en,
        sangam_id: 'sgm-mdu',
        sangam_name: this.registrationDraft.sangamName_en,
        occupation: this.registrationDraft.occupation,
        sangam_role: this.registrationDraft.sangamRole,
        profile_photo: this.registrationDraft.avatarUrl || 'assets/logo.jpg'
      };

      let regApiSuccess = false;
      let regApiData = null;
      let httpStatus = 0;

      try {
        const regRes = await fetch('/api/auth/register-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        httpStatus = regRes.status;
        regApiData = await regRes.json();
        console.log('[AAVIN REGISTRATION] [API RESPONSE]', { status: httpStatus, success: regApiData?.success, error: regApiData?.error });
        if (regRes.ok && regApiData && regApiData.success) {
          regApiSuccess = true;
        }
      } catch (gatewayErr) {
        console.warn('[AAVIN REGISTRATION] Gateway network notice:', gatewayErr);
      }

      if (!regApiSuccess) {
        // Handle 429 Rate Limit
        if (httpStatus === 429 || (regApiData && (regApiData.error === 'RATE_LIMITED' || (regApiData.message || '').includes('429')))) {
          console.warn('[AAVIN REGISTRATION] [429 DETECTED] Server returned 429 Rate Limit.');
          this.isSubmittingReg = false;
          this.isLoading = false;
          this.errorMessage = regApiData?.message || 'Too many registration attempts. Please wait a moment and try again.';
          this.render();
          return;
        }

        // Handle 409 Duplicate User
        if (httpStatus === 409 || (regApiData && regApiData.error === 'USER_ALREADY_EXISTS')) {
          this.isSubmittingReg = false;
          this.isLoading = false;
          this.errorMessage = regApiData?.message || 'An account with this email address is already registered. Please log in.';
          this.render();
          return;
        }

        // If gateway returned a specific validation or business logic error
        if (regApiData && regApiData.message) {
          this.isSubmittingReg = false;
          this.isLoading = false;
          this.errorMessage = regApiData.message;
          this.render();
          return;
        }

        // Fallback to direct client signUpMember ONLY if gateway was unreachable
        const authService = window.AAVIN_SUPABASE_AUTH;
        if (!authService || typeof authService.signUpMember !== 'function') {
          throw new Error('Authentication service initialization failed. Please try submitting again.');
        }

        const res = await authService.signUpMember(this.registrationDraft);
        this.isSubmittingReg = false;
        this.isLoading = false;

        if (res.success) {
          if (res.requireEmailConfirmation) {
            this.currentFlow = 'login';
            this.unconfirmedEmail = this.registrationDraft.email;
            this.loginIdentifier = this.registrationDraft.email;
            this.loginPassword = '';
            this.infoMessage = res.message;
            this.successMessage = 'Registration initiated! Please check your email inbox to confirm your account with Supabase before logging in.';
            this.render();
          } else {
            if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
              window.AAVIN_APP.showToast(res.message || 'Account Created Successfully!');
            }
            this.finishLogin(res.member || res.user || {});
          }
        } else {
          this.errorMessage = res.error || 'Failed to complete registration. Please try again.';
          this.render();
        }
        return;
      }

      // 2. Immediate Authenticated Member Login with Created Credentials
      const authService = window.AAVIN_SUPABASE_AUTH;
      const loginRes = await authService.signInMember(this.registrationDraft.email, this.registrationDraft.password);
      this.isSubmittingReg = false;
      this.isLoading = false;

      if (loginRes.success) {
        if (window.AAVIN_APP && window.AAVIN_APP.showToast) {
          window.AAVIN_APP.showToast('Account Created and Logged in Successfully!');
        }
        this.finishLogin(loginRes.member || loginRes.user || {});
      } else if (loginRes.isUnconfirmed) {
        this.currentFlow = 'login';
        this.unconfirmedEmail = this.registrationDraft.email;
        this.loginIdentifier = this.registrationDraft.email;
        this.loginPassword = '';
        this.infoMessage = loginRes.error;
        this.successMessage = 'Account created! Please check your email inbox to confirm your account with Supabase before logging in.';
        this.render();
      } else {
        this.errorMessage = loginRes.error || 'Registration created but login failed. Please log in manually.';
        this.render();
      }
    } catch (err) {
      this.isSubmittingReg = false;
      this.isLoading = false;
      this.errorMessage = err.message || 'An unexpected error occurred during registration.';
      this.render();
    }
  },

  finishLogin(user) {
    this.clearOtpSession();
    this.currentFlow = 'home';
    const header = document.querySelector('.app-header');
    const bottomNav = document.getElementById('mobileBottomNav');
    if (header) header.style.display = '';
    if (bottomNav) bottomNav.style.display = '';
    const role = (user && user.role) ? user.role : 'member';
    window.AAVIN_STORE.setRole(role);
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
    if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.ensureReady === 'function') {
      await window.AAVIN_SUPABASE_AUTH.ensureReady();
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
      if (this.otpInterval) clearInterval(this.otpInterval);
      await window.AAVIN_SUPABASE_AUTH.signOut();
      this.currentFlow = 'login';
      this.loginPassword = '';
      this.loginIdentifier = '';
      this.otpPhone = '';
      this.isPhoneVerified = false;
      this.isOtpSent = false;
      this.otpValue = ['', '', '', '', '', ''];
      this.errorMessage = '';
      this.successMessage = '';
      this.render();
    }
  }
};

window.openRegistration = function () {
  if (window.AAVIN_COMPONENTS.Auth) {
    window.AAVIN_COMPONENTS.Auth.startRegistration();
  }
};
