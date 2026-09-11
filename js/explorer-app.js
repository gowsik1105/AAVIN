/**
 * AAVIN MAIN DAIRY EXPLORER
 * Master Application Orchestrator & Coordinator
 */

window.AAVIN_EXPLORER = {
  currentFilter: 'ALL',
  selectedDairy: null,
  dairies: [],

  init() {
    // 1. Fetch from verified dataset
    this.dairies = window.AAVIN_DAIRY_DATA || [];

    // 2. Render Page Structure
    this.renderApp();

    // 3. Initialize Three.js 3D Tamil Nadu Map
    setTimeout(() => {
      if (window.AAVIN_3D_MAP) {
        window.AAVIN_3D_MAP.init('threeMapContainer', this.dairies);
      }
      // Dismiss Preloader smoothly
      if (window.AAVIN_HERO) {
        setTimeout(() => window.AAVIN_HERO.dismissPreloader(), 400);
      }
    }, 150);

    // 4. Setup Scroll Listeners for Navbar
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('explorerNavbar');
      if (navbar) {
        if (window.scrollY > 40) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      }
    });
  },

  renderApp() {
    const root = document.getElementById('explorerRoot');
    if (!root) return;

    const uniqueDistricts = [...new Set(this.dairies.map(d => d.district))];

    root.innerHTML = `
      <!-- Navigation Bar -->
      <nav class="explorer-navbar" id="explorerNavbar">
        <a href="#hero" class="nav-brand">
          <div class="brand-icon-wrap">🥛</div>
          <div class="brand-text">
            <span class="brand-title">AAVIN EXPLORER</span>
            <span class="brand-subtitle">Tamil Nadu Main Dairies</span>
          </div>
        </a>

        <ul class="nav-links">
          <li><a href="#hero" class="nav-link active">Home</a></li>
          <li><a href="#mapSection" class="nav-link">3D Map</a></li>
          <li><a href="#districts" class="nav-link">Districts</a></li>
          <li><a href="#directory" class="nav-link">Verified Directory</a></li>
          <li><a href="#about" class="nav-link">About Criteria</a></li>
        </ul>

        <div class="nav-actions">
          <button class="btn-explorer btn-explorer-nearby" id="findNearbyBtn" onclick="window.AAVIN_SEARCH_NEARBY.triggerNearbySearch()">
            <span>📍</span> Find Nearby
          </button>
          <button class="btn-icon-round" onclick="window.AAVIN_EXPLORER.toggleLanguage()" title="Switch Language">
            <span id="langIndicator" style="font-size:12px; font-weight:800;">தமிழ்</span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main>
        <!-- Hero Section & Preloader -->
        ${window.AAVIN_HERO.render(this.dairies.length, uniqueDistricts.length)}

        <!-- 3D Tamil Nadu Map Section -->
        <section class="map-showcase-section" id="mapSection">
          <div class="map-card-container">
            <!-- Three.js Canvas Container -->
            <div id="threeMapContainer" style="width:100%; height:100%;"></div>

            <!-- Top Left HUD -->
            <div class="map-hud-top-left">
              <div class="map-hud-badge">
                <span class="hero-tag-pulse"></span>
                <span>Tamil Nadu 3D Infrastructure Network</span>
              </div>
            </div>

            <!-- Top Right Map Controls -->
            <div class="map-hud-top-right">
              <button class="map-control-btn" onclick="window.AAVIN_EXPLORER.resetMapCamera()" title="Reset Camera View">
                <span>🔄</span>
              </button>
              <button class="map-control-btn" id="rotateToggleBtn" onclick="window.AAVIN_EXPLORER.toggleMapRotation()" title="Toggle 3D Rotation">
                <span>🌐</span>
              </button>
            </div>

            <!-- Bottom Left Legend -->
            <div class="map-hud-legend">
              <div style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:2px;">Facility Legend</div>
              <div class="legend-item"><span class="legend-dot" style="color:#0284c7;"></span> Main Dairy</div>
              <div class="legend-item"><span class="legend-dot" style="color:#059669;"></span> Feeder Balancing</div>
              <div class="legend-item"><span class="legend-dot" style="color:#d97706;"></span> Dairy Plant</div>
              <div class="legend-item"><span class="legend-dot" style="color:#7c3aed;"></span> Processing Unit</div>
              <div class="legend-item"><span class="legend-dot" style="color:#db2777;"></span> Specialised / Ice Cream</div>
            </div>

            <!-- Floating 3D Dairy Card Container -->
            <div id="floatingCardHost"></div>
          </div>
        </section>

        <!-- Hover Tooltip -->
        <div class="map-hover-tooltip" id="mapHoverTooltip"></div>

        <!-- District Explorer (3D Tilt Cards) -->
        ${window.AAVIN_DISTRICT_EXPLORER.render(this.dairies)}

        <!-- Verified Dairies Directory Section -->
        <section class="directory-section" id="directory">
          <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px;">
            <div>
              <span class="section-tag">Authoritative Index</span>
              <h2 class="section-title">All Verified Main Dairy Plants</h2>
              <p class="section-desc">Exclusively certified dairy processing infrastructure. BMCs and local booths are excluded.</p>
            </div>
            <div style="font-size:13px; font-weight:700; color:var(--aavin-forest);">
              Showing <span id="directoryCount">${this.dairies.length}</span> Verified Facilities
            </div>
          </div>

          <div class="directory-grid" id="directoryCardsGrid">
            <!-- Injected via renderDirectoryCards -->
          </div>
        </section>

        <!-- About Strict Criteria Section -->
        <section class="about-section" id="about">
          <div class="about-banner-card">
            <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:var(--radius-full); font-size:12px; font-weight:700; text-transform:uppercase;">
              Government Quality Standard
            </span>
            <h2 style="font-size:clamp(1.8rem, 3vw, 2.4rem); font-weight:800; margin-top:10px; max-width:700px; line-height:1.2;">
              Why this application only features Aavin Main Dairies
            </h2>
            <p style="font-size:15px; opacity:0.95; max-width:680px; margin-top:10px; line-height:1.5;">
              Primary societies, chilling centres (BMCs), and retail booths handle localized collection and point-of-sale retail. This platform maps Tamil Nadu's high-capacity central processing backbone.
            </p>

            <div class="about-grid-reasons">
              <div class="reason-card">
                <h4>🏢 Main Dairies & Feeder Plants</h4>
                <p>Industrial facilities equipped with automated pasteurizers, homogenizers, standardization silos, and cold chains operating up to 400,000+ Litres Per Day.</p>
              </div>
              <div class="reason-card">
                <h4>🚫 Zero BMCs or Chilling Centres</h4>
                <p>All Bulk Milk Chilling (BMC) units are intentionally excluded to prevent directory dilution and maintain authoritative focus on central plants.</p>
              </div>
              <div class="reason-card">
                <h4>🛡️ Verified Madurai Campus</h4>
                <p>Features the confirmed Sathamangalam Main Dairy and Specialised Ice Cream Plant campus at Sivagangai Main Road, Madurai - 625020.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="explorer-footer">
        <div class="footer-container">
          <div class="footer-top">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span style="font-size:24px;">🥛</span>
                <strong style="font-size:18px; letter-spacing:0.5px;">AAVIN MAIN DAIRY EXPLORER</strong>
              </div>
              <p style="font-size:13px; color:#94a3b8; max-width:440px; line-height:1.5;">
                Official Dairy Infrastructure Discovery System for Tamil Nadu Co-operative Milk Producers' Federation Ltd (TCMPF) and District Cooperative Unions.
              </p>
            </div>

            <div style="display:flex; gap:40px; flex-wrap:wrap; font-size:13px;">
              <div>
                <strong style="color:white; display:block; margin-bottom:10px;">Navigation</strong>
                <div style="display:flex; flex-direction:column; gap:6px; color:#94a3b8;">
                  <a href="#hero" style="color:inherit; text-decoration:none;">Home</a>
                  <a href="#mapSection" style="color:inherit; text-decoration:none;">3D Map</a>
                  <a href="#districts" style="color:inherit; text-decoration:none;">Districts</a>
                  <a href="#directory" style="color:inherit; text-decoration:none;">Verified Directory</a>
                </div>
              </div>

              <div>
                <strong style="color:white; display:block; margin-bottom:10px;">Authority</strong>
                <div style="display:flex; flex-direction:column; gap:6px; color:#94a3b8;">
                  <span>Dairy Development Dept</span>
                  <span>Govt of Tamil Nadu</span>
                  <span>Toll-Free: 1800-425-4422</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <div>© 2026 Aavin Main Dairy Explorer • Government of Tamil Nadu</div>
            <div>Strict Location Filtering • 100% Verified Main Processing Plants</div>
          </div>
        </div>
      </footer>

      <!-- Modal Container -->
      <div id="modalContainer"></div>
    `;

    this.renderDirectoryCards();
  },

  renderDirectoryCards() {
    const grid = document.getElementById('directoryCardsGrid');
    if (!grid) return;

    const filtered = this.currentFilter === 'ALL'
      ? this.dairies
      : this.dairies.filter(d => d.facility_type === this.currentFilter);

    const userCoords = window.AAVIN_STORE ? window.AAVIN_STORE.state.userCoords : null;

    grid.innerHTML = filtered.map(d => window.AAVIN_DAIRY_CARDS.renderDirectoryCard(d, userCoords)).join('');

    const countEl = document.getElementById('directoryCount');
    if (countEl) countEl.textContent = filtered.length;
  },

  selectDairy(dairy) {
    this.selectedDairy = dairy;
    const host = document.getElementById('floatingCardHost');
    if (host) {
      const userCoords = window.AAVIN_STORE ? window.AAVIN_STORE.state.userCoords : null;
      host.innerHTML = window.AAVIN_DAIRY_CARDS.renderFloatingCard(dairy, userCoords);
    }
  },

  closeFloatingCard() {
    const host = document.getElementById('floatingCardHost');
    if (host) host.innerHTML = '';
  },

  focusDairyOnMap(dairyId) {
    const dairy = this.dairies.find(d => d.id === dairyId);
    if (!dairy) return;

    if (window.AAVIN_3D_MAP) {
      window.AAVIN_3D_MAP.focusOnDairy(dairyId);
    }
    this.selectDairy(dairy);
  },

  focusDistrictOnMap(districtName) {
    if (window.AAVIN_3D_MAP) {
      window.AAVIN_3D_MAP.focusOnDistrict(districtName);
    }
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  filterFacility(type, btnEl) {
    this.currentFilter = type;

    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    if (window.AAVIN_3D_MAP) {
      window.AAVIN_3D_MAP.filterBeacons(type);
    }

    this.renderDirectoryCards();
  },

  resetMapCamera() {
    if (window.AAVIN_3D_MAP) {
      window.AAVIN_3D_MAP.resetCamera();
    }
    this.closeFloatingCard();
  },

  toggleMapRotation() {
    if (window.AAVIN_3D_MAP) {
      const active = window.AAVIN_3D_MAP.toggleAutoRotate();
      const btn = document.getElementById('rotateToggleBtn');
      if (btn) {
        btn.style.color = active ? 'var(--aavin-forest)' : 'var(--text-muted)';
      }
    }
  },

  toggleLanguage() {
    const ind = document.getElementById('langIndicator');
    if (!ind) return;

    if (ind.textContent === 'தமிழ்') {
      ind.textContent = 'English';
      alert('மொழி மாற்றப்பட்டது: தமிழ் (ஆவின் முதன்மை பால் பண்ணைகள்)');
    } else {
      ind.textContent = 'தமிழ்';
      alert('Language switched to English.');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.AAVIN_EXPLORER.init();
});
