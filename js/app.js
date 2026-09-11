/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Master Application Orchestrator & Router
 */

window.AAVIN_APP = {
  activeParams: {},

  init() {
    this.injectStaticIcons();

    // Initialize Supabase Auth Engine
    if (window.AAVIN_SUPABASE_AUTH) {
      window.AAVIN_SUPABASE_AUTH.init();
    }

    // Listen for store updates
    window.AAVIN_STORE.subscribe(() => {
      this.renderCurrentView();
      this.updateHeaderBadges();
    });

    // Listen for language change events
    window.addEventListener('aavin:lang-changed', () => {
      this.renderCurrentView();
      this.updateHeaderBadges();
      this.renderNavigation();
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Start auth check (Splash / Onboarding / Login / Home)
    if (window.AAVIN_COMPONENTS.Auth) {
      window.AAVIN_COMPONENTS.Auth.init();
    } else {
      this.renderNavigation();
      this.renderCurrentView();
      this.updateHeaderBadges();
    }
  },

  injectStaticIcons() {
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    
    const govEl = document.getElementById('govIcon');
    if (govEl) govEl.innerHTML = icon('gov', { size: 14, color: '#f0f7ff' });

    const roleEl = document.getElementById('roleIcon');
    if (roleEl) roleEl.innerHTML = icon('user', { size: 14, color: '#0b4f8a' });

    const bellEl = document.getElementById('headerBellIcon');
    if (bellEl) bellEl.innerHTML = icon('bell', { size: 16, color: 'currentColor' });

    const searchEl = document.getElementById('headerSearchIcon');
    if (searchEl) searchEl.innerHTML = icon('search', { size: 14, color: 'currentColor' });
  },

  navigate(tab, params = {}) {
    this.activeParams = params;
    window.AAVIN_STORE.setTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderCurrentView() {
    const mainContainer = document.getElementById('mainContentArea');
    if (!mainContainer) return;

    // Check if in Auth flow (Splash/Onboarding/Phone/OTP/Register)
    if (window.AAVIN_COMPONENTS.Auth && window.AAVIN_COMPONENTS.Auth.currentFlow !== 'home') {
      window.AAVIN_COMPONENTS.Auth.render();
      return;
    }

    const role = window.AAVIN_STORE.state.currentRole;
    let tab = window.AAVIN_STORE.state.currentTab;

    // Role-specific landing tab routing
    if (tab === 'home') {
      if (role === 'sangam_admin') tab = 'admin_sangam';
      else if (role === 'district_admin') tab = 'admin_district';
      else if (role === 'tamil_nadu_admin' || role === 'state_admin' || role === 'admin') tab = 'admin_state';
    }

    // Strict Database-Backed Admin Route Guard (TASK 4 & TASK 7)
    const adminTabs = ['admin_sangam', 'admin_district', 'admin_state', 'admin_users', 'heatmap', 'analytics'];
    if (adminTabs.includes(tab)) {
      const isDbAdmin = window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.hasAdminSession();
      if (!isDbAdmin) {
        const lang = window.I18N ? window.I18N.currentLang : 'ta';
        const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
        mainContainer.innerHTML = `
          <div style="max-width: 520px; margin: 40px auto; text-align: center;">
            <div class="card card-floating-3d" style="padding: 32px 24px; border-top: 5px solid #dc2626;">
              <div style="font-size: 44px; margin-bottom: 12px;">🚫</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #dc2626; margin-bottom: 8px;">
                ${lang === 'ta' ? 'அணுகல் மறுக்கப்பட்டது (Access Denied)' : 'Admin Access Restricted'}
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
                ${lang === 'ta' 
                  ? 'இந்த நிர்வாக பக்கத்தை அணுக உங்கள் பயனர் கணக்கிற்கு Supabase Database மூலம் அனுமதி வழங்கப்படவில்லை.' 
                  : 'You do not have administrative privileges in the Supabase database to view this protected dashboard.'}
              </p>
              <div style="display: flex; justify-content: center; gap: 10px;">
                <button type="button" class="btn btn-primary" onclick="window.AAVIN_COMPONENTS.AdminAuth.showLoginModal()">
                  ${icon('shieldCheck', { size: 16, color: '#ffffff' })}
                  <span>${lang === 'ta' ? 'நிர்வாகியாக உள்நுழைக' : 'Admin Login'}</span>
                </button>
                <button type="button" class="btn btn-secondary" onclick="window.AAVIN_APP.navigate('home')">
                  <span>${lang === 'ta' ? 'முகப்புக்கு திரும்பு' : 'Return to Safe Home'}</span>
                </button>
              </div>
            </div>
          </div>
        `;
        this.updateActiveNavIndicators(tab);
        return;
      }
    }

    // Role-Based Access Control
    if (window.AAVIN_RBAC && typeof window.AAVIN_RBAC.canAccess === 'function') {
      if (!window.AAVIN_RBAC.canAccess(role, tab)) {
        const lang = window.I18N ? window.I18N.currentLang : 'ta';
        const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
        mainContainer.innerHTML = `
          <div style="max-width: 540px; margin: 40px auto; text-align: center;">
            <div class="card card-floating-3d" style="padding: 32px 24px; border-top: 5px solid #dc2626;">
              <div style="font-size: 42px; margin-bottom: 10px;">🔒</div>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #dc2626; margin-bottom: 8px;">
                ${lang === 'ta' ? 'அணுகல் அனுமதி இல்லை (Access Denied)' : 'Access Restricted'}
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 18px;">
                ${lang === 'ta' 
                  ? 'இந்த பக்கத்தை பார்க்க உங்கள் பயனர் வகைக்கு (Role) அதிகாரம் வழங்கப்படவில்லை.' 
                  : 'You do not have administrative authorization to view this protected view.'}
              </p>
              <button class="btn btn-primary" onclick="window.AAVIN_APP.navigate('home')">
                ${icon('home', { size: 16, color: '#ffffff' })}
                <span>${lang === 'ta' ? 'முகப்பு பக்கத்திற்கு செல்க' : 'Return to Safe Home'}</span>
              </button>
            </div>
          </div>
        `;
        this.updateActiveNavIndicators(tab);
        return;
      }
    }

    let html = '';

    switch (tab) {
      case 'home':
        html = window.AAVIN_COMPONENTS.MemberHome ? window.AAVIN_COMPONENTS.MemberHome.render() : '';
        break;
      case 'news':
        html = window.AAVIN_COMPONENTS.NewsChannel ? window.AAVIN_COMPONENTS.NewsChannel.render() : '';
        break;
      case 'meetings':
        html = window.AAVIN_COMPONENTS.Meetings ? window.AAVIN_COMPONENTS.Meetings.render(this.activeParams.view || 'upcoming') : '';
        break;
      case 'issues':
        html = window.AAVIN_COMPONENTS.IssueSystem ? window.AAVIN_COMPONENTS.IssueSystem.render(this.activeParams.action || 'report') : '';
        break;
      case 'digital_id':
        html = window.AAVIN_COMPONENTS.DigitalId ? window.AAVIN_COMPONENTS.DigitalId.render() : '';
        break;
      case 'map':
      case 'sangam_profile':
        html = window.AAVIN_COMPONENTS.AavinMap ? window.AAVIN_COMPONENTS.AavinMap.render() : '';
        break;
      case 'admin_sangam':
        html = window.AAVIN_COMPONENTS.AdminPortals ? window.AAVIN_COMPONENTS.AdminPortals.renderSangamAdmin() : '';
        break;
      case 'admin_district':
        html = window.AAVIN_COMPONENTS.AdminPortals ? window.AAVIN_COMPONENTS.AdminPortals.renderDistrictAdmin() : '';
        break;
      case 'admin_state':
        html = window.AAVIN_COMPONENTS.AdminPortals ? window.AAVIN_COMPONENTS.AdminPortals.renderStateAdmin() : '';
        break;
      case 'admin_users':
        html = window.AAVIN_COMPONENTS.AdminPortals ? window.AAVIN_COMPONENTS.AdminPortals.renderUserManagement() : '';
        break;
      case 'heatmap':
        html = window.AAVIN_COMPONENTS.Analytics ? window.AAVIN_COMPONENTS.Analytics.renderHeatmap() : '';
        break;
      case 'analytics':
        html = window.AAVIN_COMPONENTS.Analytics ? window.AAVIN_COMPONENTS.Analytics.renderAnalytics() : '';
        break;
      case 'help':
        html = window.AAVIN_COMPONENTS.HelpSearch ? window.AAVIN_COMPONENTS.HelpSearch.renderHelp() : '';
        break;
      case 'settings':
        html = window.AAVIN_COMPONENTS.Settings ? window.AAVIN_COMPONENTS.Settings.render() : '';
        break;
      case 'terms':
        html = window.AAVIN_COMPONENTS.Settings ? window.AAVIN_COMPONENTS.Settings.renderTerms() : '';
        break;
      case 'privacy':
        html = window.AAVIN_COMPONENTS.Settings ? window.AAVIN_COMPONENTS.Settings.renderPrivacy() : '';
        break;
      case 'more':
        html = this.renderMoreMenu();
        break;
      default:
        html = window.AAVIN_COMPONENTS.MemberHome ? window.AAVIN_COMPONENTS.MemberHome.render() : '';
    }

    mainContainer.innerHTML = html;
    this.updateActiveNavIndicators(tab);

    // Initialize Leaflet map if map tab active
    if (tab === 'map' || tab === 'sangam_profile') {
      setTimeout(() => {
        if (window.AAVIN_COMPONENTS.AavinMap && window.AAVIN_COMPONENTS.AavinMap.initLeafletMap) {
          window.AAVIN_COMPONENTS.AavinMap.initLeafletMap();
        }
      }, 80);
    }
  },

  renderMoreMenu() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const member = window.AAVIN_DATA.currentMember;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 680px; margin: 0 auto;">
        <!-- Header Profile Card -->
        <div class="card card-floating-3d" style="margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 52px; height: 52px; border-radius: 14px; overflow: hidden; border: 2px solid white; box-shadow: 0 4px 12px rgba(11, 79, 138, 0.25); background: #ffffff; flex-shrink: 0;">
              <img src="${member.avatarUrl}" alt="Aavin Member" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? (member.name_ta || member.name_en) : member.name_en}</div>
              <div style="font-size: 12.5px; color: var(--text-muted);">${member.memberId} • ${lang === 'ta' ? (member.districtName_ta || member.districtName_en) : member.districtName_en}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('digital_id')">
            ${icon('digitalId', { size: 14, color: 'currentColor' })}
            <span>${t('navDigitalId')}</span>
          </button>
        </div>

        <h3 style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
          ${icon('menu', { size: 18, color: '#0b4f8a' })}
          <span>${t('navMore')}</span>
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Main Dairy Map -->
          <div class="card card-floating-3d" style="padding: 14px; cursor: pointer; border-left: 4px solid var(--aavin-primary);" onclick="window.AAVIN_APP.navigate('map')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 12px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
                  ${icon('map', { size: 22, color: '#0284c7' })}
                </div>
                <div>
                  <strong style="font-size: 14.5px; color: var(--aavin-primary);">${t('navMap')}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? 'அனைத்து மாவட்ட முதன்மை பால் பண்ணைகள் வரைபடம்' : 'Explore Verified District Main Dairies & Processing Plants'}</div>
                </div>
              </div>
              <span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 800;">Open →</span>
            </div>
          </div>

          <!-- Digital ID -->
          <div class="card card-floating-3d" style="padding: 14px; cursor: pointer;" onclick="window.AAVIN_APP.navigate('digital_id')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 12px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center;">
                  ${icon('digitalId', { size: 22, color: '#d97706' })}
                </div>
                <div>
                  <strong style="font-size: 14.5px; color: var(--text-primary);">${t('navDigitalId')}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? '3D டிஜிட்டல் உறுப்பினர் அடையாள அட்டை & QR' : '3D Interactive Membership Card & Tamper-Proof QR'}</div>
                </div>
              </div>
              <span style="color: var(--text-muted); font-size: 16px;">→</span>
            </div>
          </div>

          <!-- Official Documents & GOs -->
          <div class="card card-floating-3d" style="padding: 14px; cursor: pointer;" onclick="window.AAVIN_APP.navigate('news')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 12px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center;">
                  ${icon('fileText', { size: 22, color: '#15803d' })}
                </div>
                <div>
                  <strong style="font-size: 14.5px; color: var(--text-primary);">${t('navDocuments')}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? 'அரசாணைகள், சுற்றறிக்கைகள் & விண்ணப்ப படிவங்கள்' : 'Government Orders, Circulars & Welfare Forms'}</div>
                </div>
              </div>
              <span style="color: var(--text-muted); font-size: 16px;">→</span>
            </div>
          </div>

          <!-- Settings & Privacy -->
          <div class="card card-floating-3d" style="padding: 14px; cursor: pointer;" onclick="window.AAVIN_APP.navigate('settings')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 12px; background: #f1f5f9; color: var(--aavin-primary); display: flex; align-items: center; justify-content: center;">
                  ${icon('settings', { size: 22, color: 'var(--aavin-primary)' })}
                </div>
                <div>
                  <strong style="font-size: 14.5px; color: var(--text-primary);">${lang === 'ta' ? 'அமைப்புகள் & தனியுரிமை' : 'Settings, Terms & Security'}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? 'அறிவிப்பு விருப்பங்கள் மற்றும் சட்டக் கொள்கைகள்' : 'App preferences, alerts, terms, and privacy'}</div>
                </div>
              </div>
              <span style="color: var(--text-muted); font-size: 16px;">→</span>
            </div>
          </div>

          <!-- Help & Support -->
          <div class="card card-floating-3d" style="padding: 14px; cursor: pointer;" onclick="window.AAVIN_APP.navigate('help')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 12px; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center;">
                  ${icon('helpCircle', { size: 22, color: '#7c3aed' })}
                </div>
                <div>
                  <strong style="font-size: 14.5px; color: var(--text-primary);">${t('navHelp')}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? '24/7 கட்டணமில்லா உதவி எண்கள் & பயன்பாட்டு கையேடு' : '24/7 Toll-Free Helplines & User Guides'}</div>
                </div>
              </div>
              <span style="color: var(--text-muted); font-size: 16px;">→</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderNavigation() {
    const role = window.AAVIN_STORE.state.currentRole;
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    // Desktop Nav Links
    const desktopNav = document.getElementById('desktopNavLinks');
    if (desktopNav) {
      if (role === 'member') {
        desktopNav.innerHTML = `
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('home')">${icon('home', { size: 15 })} ${t('navHome')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('news')">${icon('news', { size: 15 })} ${t('navNews')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('meetings')">${icon('video', { size: 15 })} ${t('navMeetings')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('issues')">${icon('issues', { size: 15 })} ${t('navIssues')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('digital_id')">${icon('digitalId', { size: 15 })} ${t('navDigitalId')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('map')">${icon('map', { size: 15 })} ${t('navMap')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('settings')">${icon('settings', { size: 15 })} Settings</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('help')">${icon('helpCircle', { size: 15 })} ${t('navHelp')}</a>
        `;
      } else if (role === 'sangam_admin') {
        desktopNav.innerHTML = `
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('admin_sangam')">${icon('gov', { size: 15 })} Sangam Admin</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('issues', { action: 'track' })">${icon('issues', { size: 15 })} Verify Issues</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('meetings')">${icon('video', { size: 15 })} Meetings</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('news')">${icon('news', { size: 15 })} Publish News</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('map')">${icon('map', { size: 15 })} ${t('navMap')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('settings')">${icon('settings', { size: 15 })} Settings</a>
        `;
      } else if (role === 'district_admin') {
        desktopNav.innerHTML = `
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('admin_district')">${icon('factory', { size: 15 })} District HQ</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('heatmap')">${icon('trendingUp', { size: 15 })} Heatmap</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('analytics')">${icon('zap', { size: 15 })} Analytics</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('issues', { action: 'track' })">${icon('issues', { size: 15 })} Escalations</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('map')">${icon('map', { size: 15 })} ${t('navMap')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('settings')">${icon('settings', { size: 15 })} Settings</a>
        `;
      } else if (role === 'admin' || role === 'tamil_nadu_admin' || role === 'state_admin') {
        desktopNav.innerHTML = `
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('admin_state')">${icon('gov', { size: 15 })} Admin Dashboard</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('admin_users')">${icon('user', { size: 15 })} User Management</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('heatmap')">${icon('trendingUp', { size: 15 })} State Heatmap</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('analytics')">${icon('zap', { size: 15 })} State Analytics</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('issues', { action: 'track' })">${icon('issues', { size: 15 })} Dept Routing</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('map')">${icon('map', { size: 15 })} ${t('navMap')}</a>
          <a href="javascript:void(0)" class="desktop-nav-link" onclick="window.AAVIN_APP.navigate('settings')">${icon('settings', { size: 15 })} Settings</a>
        `;
      }
    }

    // Bottom Navigation (5-Tab Mobile Bar)
    const bottomNav = document.getElementById('mobileBottomNav');
    if (bottomNav) {
      bottomNav.innerHTML = `
        <button class="bottom-nav-item" id="navItem-home" onclick="window.AAVIN_APP.navigate('home')">
          <span class="nav-icon">${icon('home', { size: 20 })}</span>
          <span>${t('navHome')}</span>
        </button>
        <button class="bottom-nav-item" id="navItem-news" onclick="window.AAVIN_APP.navigate('news')">
          <span class="nav-icon">${icon('news', { size: 20 })}</span>
          <span>${t('navNews')}</span>
        </button>
        <button class="bottom-nav-item" id="navItem-meetings" onclick="window.AAVIN_APP.navigate('meetings')">
          <span class="nav-icon">${icon('video', { size: 20 })}</span>
          <span>${t('navMeetings')}</span>
        </button>
        <button class="bottom-nav-item" id="navItem-issues" onclick="window.AAVIN_APP.navigate('issues')">
          <span class="nav-icon">${icon('issues', { size: 20 })}</span>
          <span>${t('navIssues')}</span>
        </button>
        <button class="bottom-nav-item" id="navItem-more" onclick="window.AAVIN_APP.navigate('more')">
          <span class="nav-icon">${icon('more', { size: 20 })}</span>
          <span>${t('navMore')}</span>
        </button>
      `;
    }
  },

  updateActiveNavIndicators(activeTab) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeBottom = document.getElementById(`navItem-${activeTab}`);
    if (activeBottom) activeBottom.classList.add('active');

    document.querySelectorAll('.desktop-nav-link').forEach(link => {
      link.classList.remove('active');
    });
  },

  updateHeaderBadges() {
    const role = window.AAVIN_STORE.state.currentRole;
    const roleSelect = document.getElementById('globalRoleSelector');
    if (roleSelect) roleSelect.value = role;

    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
      langToggleBtn.textContent = window.I18N.currentLang === 'ta' ? 'English' : 'தமிழ்';
    }

    const appTitleEl = document.getElementById('headerAppTitle');
    if (appTitleEl) appTitleEl.textContent = window.I18N.t('appName');

    const appSubTitleEl = document.getElementById('headerAppSubTitle');
    if (appSubTitleEl) appSubTitleEl.textContent = window.I18N.t('appSubTitle');

    // Dynamic unread notifications badge
    const badgeEl = document.getElementById('headerBellBadge');
    if (badgeEl && window.AAVIN_COMPONENTS.Notifications) {
      const count = window.AAVIN_COMPONENTS.Notifications.getUnreadCount();
      badgeEl.textContent = count;
      badgeEl.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  handleRoleChange(newRole) {
    // If selecting an admin role without active Supabase admin auth session, prompt login
    if (newRole !== 'member') {
      const hasAuth = window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.hasAdminSession(newRole);
      if (!hasAuth) {
        // Revert select back to current active role
        const roleSelect = document.getElementById('globalRoleSelector');
        if (roleSelect) roleSelect.value = window.AAVIN_STORE.state.currentRole;

        if (window.AAVIN_COMPONENTS.AdminAuth) {
          window.AAVIN_COMPONENTS.AdminAuth.showLoginModal(newRole);
        }
        return;
      }
    }

    window.AAVIN_STORE.setRole(newRole);
    if (newRole === 'member') window.AAVIN_STORE.setTab('home');
    else if (newRole === 'sangam_admin') window.AAVIN_STORE.setTab('admin_sangam');
    else if (newRole === 'district_admin') window.AAVIN_STORE.setTab('admin_district');
    else if (newRole === 'tamil_nadu_admin' || newRole === 'state_admin') window.AAVIN_STORE.setTab('admin_state');
    this.renderNavigation();
    this.showToast(`Role Switched: ${newRole.replace('_', ' ').toUpperCase()}`);
  },

  toggleLanguage() {
    const next = window.I18N.currentLang === 'ta' ? 'en' : 'ta';
    window.I18N.setLang(next);
    this.showToast(next === 'ta' ? 'மொழி: தமிழ்' : 'Language: English');
  },

  showToast(message) {
    let toast = document.getElementById('globalFloatingToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalFloatingToast';
      toast.className = 'toast-floating';
      document.body.appendChild(toast);
    }
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    toast.innerHTML = `${icon('check', { size: 14, color: '#4ade80' })} <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },

  showNotifications() {
    if (window.AAVIN_COMPONENTS.Notifications) {
      const html = window.AAVIN_COMPONENTS.Notifications.renderModal();
      this.openModal(html);
    }
  },

  showQrVerificationModal() {
    const html = window.AAVIN_COMPONENTS.HelpSearch.renderQrVerificationModal();
    this.openModal(html);
  },

  triggerSearch(query) {
    if (!query) return;
    const html = window.AAVIN_COMPONENTS.HelpSearch.renderUniversalSearch(query);
    this.openModal(html);
  },

  openModal(contentHtml) {
    const backdrop = document.getElementById('globalModalBackdrop');
    if (backdrop) {
      backdrop.innerHTML = contentHtml;
      backdrop.classList.add('open');
    }
  },

  closeModal() {
    const backdrop = document.getElementById('globalModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.innerHTML = '';
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.AAVIN_APP.init();
});
