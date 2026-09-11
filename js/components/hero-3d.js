/**
 * AAVIN MAIN DAIRY EXPLORER
 * Hero Section & Animated Milk Preloader Component
 */

window.AAVIN_HERO = {
  render(totalPlants = 22, totalDistricts = 18) {
    return `
      <!-- Preloader Overlay -->
      <div class="explorer-preloader" id="explorerPreloader">
        <div class="milk-drop-container">
          <div class="milk-drop"></div>
          <div class="milk-ripple"></div>
        </div>
        <div style="margin-top:20px; font-weight:800; color:var(--aavin-forest); font-size:16px; letter-spacing:0.5px;">
          AAVIN MAIN DAIRY EXPLORER
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
          Initializing 3D Tamil Nadu Processing Network...
        </div>
      </div>

      <!-- Hero Section -->
      <section class="hero-section" id="hero">
        <div class="hero-tag-wrap">
          <div class="hero-tag-pulse"></div>
          <span class="hero-tag-text">Authoritative Infrastructure Discovery</span>
        </div>

        <h1 class="hero-headline">
          Explore Aavin Main Dairies <br>
          <span class="gradient-text">Across Tamil Nadu</span>
        </h1>

        <p class="hero-subtitle">
          Discover verified Aavin dairy processing plants, feeder balancing dairies, and specialized facilities. Strictly excluding BMCs, chilling centres, and retail outlets.
        </p>

        <!-- Search Command Bar -->
        <div class="hero-search-wrapper">
          <div class="hero-search-bar">
            <span class="hero-search-icon">🔍</span>
            <input 
              type="text" 
              class="hero-search-input" 
              id="heroSearchInput"
              placeholder="Search by district, city or dairy name (e.g. Madurai, Sholinganallur)..."
              oninput="window.AAVIN_SEARCH_NEARBY.handleSearchInput(this.value)"
              autocomplete="off"
            />
            <button class="btn-explorer btn-explorer-primary" onclick="window.AAVIN_SEARCH_NEARBY.executeSearch(document.getElementById('heroSearchInput').value)">
              Explore
            </button>
          </div>

          <!-- Autocomplete Dropdown -->
          <div id="heroSearchDropdown" style="display:none; position:absolute; top:calc(100% + 8px); left:0; width:100%; background:white; border-radius:var(--radius-md); box-shadow:var(--shadow-lg); border:1px solid var(--border-subtle); z-index:100; text-align:left;"></div>
        </div>

        <!-- Quick Facility Filter Chips -->
        <div class="hero-chips-wrap">
          <button class="filter-chip active" onclick="window.AAVIN_EXPLORER.filterFacility('ALL', this)">All Facilities (22)</button>
          <button class="filter-chip" onclick="window.AAVIN_EXPLORER.filterFacility('MAIN_DAIRY', this)">🏢 Main Dairies</button>
          <button class="filter-chip" onclick="window.AAVIN_EXPLORER.filterFacility('FEEDER_BALANCING_DAIRY', this)">⚡ Feeder Balancing</button>
          <button class="filter-chip" onclick="window.AAVIN_EXPLORER.filterFacility('DAIRY_PLANT', this)">🏭 Dairy Plants</button>
          <button class="filter-chip" onclick="window.AAVIN_EXPLORER.filterFacility('SPECIALISED_DAIRY_PLANT', this)">🍦 Specialised / Ice Cream</button>
        </div>

        <!-- Metrics Ribbon -->
        <div class="hero-metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${totalPlants}</div>
            <div class="metric-label">Verified Main Dairy Plants</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">100%</div>
            <div class="metric-label">Strict Filter (Zero BMCs)</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${totalDistricts}</div>
            <div class="metric-label">District Cooperative Unions</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">1.8M+</div>
            <div class="metric-label">LPD Processing Capacity</div>
          </div>
        </div>
      </section>
    `;
  },

  dismissPreloader() {
    const preloader = document.getElementById('explorerPreloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
      }, 650);
    }
  }
};
