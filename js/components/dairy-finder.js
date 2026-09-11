/**
 * AAVIN SANGAM
 * Authoritative Aavin Main Dairy Finder & Dairy Processing Plant Locator
 * 
 * STRICT COMPLIANCE:
 * Displays ONLY Main Dairies, Dairy Plants, Processing Units, and Feeder Balancing Dairies.
 * ALL BMCs, Chilling Centres, Milk Booths, and Parlours are strictly rejected.
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.DairyFinder = {
  selectedDistrict: 'ALL',
  selectedFacilityType: 'ALL',
  searchQuery: '',
  leafletMap: null,
  markersLayer: null,
  isLocating: false,

  render() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const role = window.AAVIN_STORE.state.currentRole;
    const dairies = this.getFilteredDairies();
    const allDairies = window.AAVIN_STORE.state.dairies;
    const userCoords = window.AAVIN_STORE.state.userCoords;

    // Unique districts list from verified main dairies
    const districtsList = [...new Set(allDairies.map(d => d.district))].sort();

    return `
      <div>
        <!-- Title & Strict Requirement Banner -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #0b4f8a; color: white; font-weight: 700;">
                  OFFICIAL INFRASTRUCTURE DIRECTORY
                </span>
                <span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 700;">
                  ✓ 100% VERIFIED DAIRIES
                </span>
              </div>
              <h2 style="font-size: 1.6rem; color: var(--aavin-primary); margin-top: 6px;">
                🏭 ${t('dairyFinderTitle')}
              </h2>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 2px;">
                ${lang === 'ta' ? 'தமிழ்நாடு அரசின் அங்கீகரிக்கப்பட்ட முதன்மை பால் பண்ணைகள் & பதப்படுத்தும் ஆலைகள்' : 'Verified Aavin Main Dairies, Feeder Balancing Dairies & Processing Plants across Tamil Nadu'}
              </p>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.DairyFinder.triggerNearestSearch()">
                ${this.isLocating ? '⏳ ' : '📍 '}${t('findNearestDairy')}
              </button>

              ${role !== 'member' ? `
                <button class="btn btn-primary btn-sm" onclick="window.AAVIN_COMPONENTS.DairyFinder.openAddModal()">
                  ${t('adminAddDairy')}
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Strict Filter Notice Banner -->
          <div style="background: #eff6ff; border: 1.5px solid #93c5fd; border-radius: var(--radius-md); padding: 10px 14px; margin-top: 14px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 22px;">🛡️</span>
            <div style="font-size: 12px; color: #1e40af; line-height: 1.4;">
              <strong>${t('strictFilterNotice')}</strong>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="card" style="padding: 14px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 12px; align-items: center;">
            <!-- Free Text Search -->
            <div style="position: relative;">
              <input 
                type="text" 
                id="dairySearchInput" 
                value="${this.searchQuery}"
                placeholder="${t('searchDairyPlaceholder')}" 
                style="width: 100%; padding: 8px 12px 8px 34px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); font-size: 13px; outline: none;"
                oninput="window.AAVIN_COMPONENTS.DairyFinder.handleSearch(this.value)"
              />
              <span style="position: absolute; left: 10px; top: 8px; font-size: 14px; color: var(--text-muted);">🔍</span>
            </div>

            <!-- District Dropdown -->
            <div>
              <select 
                id="dairyDistrictSelect" 
                style="width: 100%; padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); font-size: 13px; background: white; cursor: pointer;"
                onchange="window.AAVIN_COMPONENTS.DairyFinder.handleDistrictFilter(this.value)"
              >
                <option value="ALL">🏛️ ${t('allDistricts')} (${allDairies.length} Plants)</option>
                ${districtsList.map(dist => `
                  <option value="${dist}" ${this.selectedDistrict === dist ? 'selected' : ''}>
                    ${dist} (${allDairies.filter(d => d.district === dist).length})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Facility Type Dropdown -->
            <div>
              <select 
                id="dairyFacilitySelect" 
                style="width: 100%; padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); font-size: 13px; background: white; cursor: pointer;"
                onchange="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter(this.value)"
              >
                <option value="ALL">🏭 ${t('allFacilityTypes')}</option>
                <option value="MAIN_DAIRY" ${this.selectedFacilityType === 'MAIN_DAIRY' ? 'selected' : ''}>🏢 ${t('facility_MAIN_DAIRY')}</option>
                <option value="FEEDER_BALANCING_DAIRY" ${this.selectedFacilityType === 'FEEDER_BALANCING_DAIRY' ? 'selected' : ''}>⚡ ${t('facility_FEEDER_BALANCING_DAIRY')}</option>
                <option value="DAIRY_PLANT" ${this.selectedFacilityType === 'DAIRY_PLANT' ? 'selected' : ''}>🏭 ${t('facility_DAIRY_PLANT')}</option>
                <option value="PROCESSING_UNIT" ${this.selectedFacilityType === 'PROCESSING_UNIT' ? 'selected' : ''}>⚙️ ${t('facility_PROCESSING_UNIT')}</option>
                <option value="SPECIALISED_DAIRY_PLANT" ${this.selectedFacilityType === 'SPECIALISED_DAIRY_PLANT' ? 'selected' : ''}>🍦 ${t('facility_SPECIALISED_DAIRY_PLANT')}</option>
              </select>
            </div>
          </div>

          <!-- Quick Facility Type Filter Pills -->
          <div style="display: flex; gap: 6px; overflow-x: auto; padding-top: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9;">
            <button class="btn btn-sm ${this.selectedFacilityType === 'ALL' ? 'btn-primary' : 'btn-secondary'}" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter('ALL')" style="font-size: 11px; padding: 4px 8px;">
              ${t('allFacilityTypes')} (${allDairies.length})
            </button>
            <button class="btn btn-sm ${this.selectedFacilityType === 'MAIN_DAIRY' ? 'btn-primary' : 'btn-secondary'}" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter('MAIN_DAIRY')" style="font-size: 11px; padding: 4px 8px;">
              🏢 Main Dairies (${allDairies.filter(d => d.facility_type === 'MAIN_DAIRY').length})
            </button>
            <button class="btn btn-sm ${this.selectedFacilityType === 'FEEDER_BALANCING_DAIRY' ? 'btn-primary' : 'btn-secondary'}" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter('FEEDER_BALANCING_DAIRY')" style="font-size: 11px; padding: 4px 8px;">
              ⚡ Feeder Balancing (${allDairies.filter(d => d.facility_type === 'FEEDER_BALANCING_DAIRY').length})
            </button>
            <button class="btn btn-sm ${this.selectedFacilityType === 'DAIRY_PLANT' ? 'btn-primary' : 'btn-secondary'}" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter('DAIRY_PLANT')" style="font-size: 11px; padding: 4px 8px;">
              🏭 Dairy Plants (${allDairies.filter(d => d.facility_type === 'DAIRY_PLANT').length})
            </button>
            <button class="btn btn-sm ${this.selectedFacilityType === 'SPECIALISED_DAIRY_PLANT' ? 'btn-primary' : 'btn-secondary'}" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleFacilityFilter('SPECIALISED_DAIRY_PLANT')" style="font-size: 11px; padding: 4px 8px;">
              🍦 Specialised / Ice Cream (${allDairies.filter(d => d.facility_type === 'SPECIALISED_DAIRY_PLANT').length})
            </button>
          </div>
        </div>

        <!-- Interactive Leaflet Map for Tamil Nadu Main Dairies -->
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
          <div style="padding: 12px 16px; background: #0b4f8a; color: white; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>🗺️ TAMIL NADU AAVIN MAIN DAIRY PROCESSING MAP</span>
              <span class="badge" style="background: rgba(255,255,255,0.2); color: white;">${dairies.length} Plants Plotted</span>
            </div>
            <div style="font-size: 11px; opacity: 0.9;">
              Click any plant marker to view union info & directions
            </div>
          </div>
          <div id="dairyLeafletMap" style="height: 380px; width: 100%; background: #e2e8f0;"></div>
        </div>

        <!-- Results Counter & Geolocation Status -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Showing ${dairies.length} Verified Aavin Dairy Processing Plants
            ${this.selectedDistrict !== 'ALL' ? `in <span style="color: var(--aavin-primary);">${this.selectedDistrict}</span>` : ''}
          </div>
          ${userCoords ? `
            <span class="badge badge-normal">
              📍 Sorted by distance from your location (${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)})
            </span>
          ` : ''}
        </div>

        <!-- Dairies Cards Grid -->
        ${dairies.length === 0 ? `
          <div class="card" style="text-align: center; padding: 40px;">
            <span style="font-size: 48px;">🏢</span>
            <h3 style="margin-top: 12px; color: var(--text-primary);">No Main Dairies Found</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              No dairy processing facilities matched your criteria. Note that BMCs and chilling centres are excluded.
            </p>
            <button class="btn btn-secondary btn-sm" style="margin-top: 14px;" onclick="window.AAVIN_COMPONENTS.DairyFinder.resetFilters()">
              Reset Filters
            </button>
          </div>
        ` : `
          <div class="grid-2" style="gap: 16px;">
            ${dairies.map(dairy => this.renderDairyCard(dairy, lang, t, role, userCoords)).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderDairyCard(dairy, lang, t, role, userCoords) {
    let distanceHtml = '';
    if (userCoords) {
      const distKm = window.AAVIN_STORE.calculateDistance(
        userCoords.latitude, userCoords.longitude,
        dairy.latitude, dairy.longitude
      );
      distanceHtml = `
        <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;">
          📍 ${distKm.toFixed(1)} ${t('kmAway')}
        </span>
      `;
    }

    const facilityColorMap = {
      MAIN_DAIRY: { bg: '#e8f2fc', text: '#0b4f8a', icon: '🏢' },
      FEEDER_BALANCING_DAIRY: { bg: '#dcfce7', text: '#15803d', icon: '⚡' },
      DAIRY_PLANT: { bg: '#fef3c7', text: '#b45309', icon: '🏭' },
      PROCESSING_UNIT: { bg: '#f3e8ff', text: '#7c3aed', icon: '⚙️' },
      SPECIALISED_DAIRY_PLANT: { bg: '#fae8ff', text: '#a21caf', icon: '🍦' }
    };

    const typeConfig = facilityColorMap[dairy.facility_type] || { bg: '#f1f5f9', text: '#475569', icon: '🏢' };

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid ${typeConfig.text};">
        <div>
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <div>
              <span class="badge" style="background: ${typeConfig.bg}; color: ${typeConfig.text}; margin-bottom: 4px;">
                ${typeConfig.icon} ${t('facility_' + dairy.facility_type)}
              </span>
              <h3 style="font-size: 15px; color: var(--aavin-primary); line-height: 1.3;">
                ${dairy.name}
              </h3>
              <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                ${dairy.official_name}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="badge ${dairy.verification_status === 'VERIFIED' ? 'badge-normal' : (dairy.verification_status === 'CROSS_VERIFIED' ? 'badge-status-verified' : 'badge-high')}">
                ${t('verification_' + dairy.verification_status)}
              </span>
              ${distanceHtml}
            </div>
          </div>

          <!-- Address & Union -->
          <div style="background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; padding: 10px; margin: 10px 0; font-size: 13px;">
            <div style="display: flex; align-items: flex-start; gap: 6px; color: var(--text-primary);">
              <span>📍</span>
              <div>
                <strong>${dairy.address}</strong>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                  Pincode: <strong>${dairy.pincode}</strong> • District: <strong>${dairy.district}</strong>
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #0b4f8a; font-weight: 600;">
              🏛️ ${dairy.union_name}
            </div>
          </div>

          <!-- Contact Details -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; margin-bottom: 12px;">
            ${dairy.phone ? `
              <a href="tel:${dairy.phone}" style="color: #15803d; text-decoration: none; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span>📞</span> ${dairy.phone}
              </a>
            ` : ''}

            ${dairy.email ? `
              <a href="mailto:${dairy.email}" style="color: #0b4f8a; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                <span>✉️</span> ${dairy.email}
              </a>
            ` : ''}

            ${dairy.website ? `
              <a href="${dairy.website}" target="_blank" rel="noopener noreferrer" style="color: #0369a1; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                <span>🌐</span> Official Web
              </a>
            ` : ''}
          </div>

          <!-- Verified Source Citation -->
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px; color: #92400e; margin-bottom: 14px;">
            <div style="font-weight: 700;">${t('sourceAttribution')}</div>
            <div>${dairy.source_name}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #b45309;">
              <a href="${dairy.source_url}" target="_blank" rel="noopener noreferrer" style="color: #0b4f8a; font-weight: 600; text-decoration: underline;">
                🔗 ${dairy.source_url}
              </a>
              <span>${t('lastVerified')} ${new Date(dairy.last_verified_at).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 12px; gap: 8px; flex-wrap: wrap;">
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${dairy.latitude},${dairy.longitude}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-primary btn-sm" 
            style="font-weight: 700;"
          >
            ${t('getDirections')}
          </a>

          ${role !== 'member' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.DairyFinder.openEditModal('${dairy.id}')">
                ✏️ ${t('adminEditDairy')}
              </button>
              <button class="btn btn-secondary btn-sm" style="color: #dc2626;" onclick="window.AAVIN_COMPONENTS.DairyFinder.handleDelete('${dairy.id}')">
                🗑️
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  getFilteredDairies() {
    let list = window.AAVIN_STORE.state.dairies || [];

    // Filter by district
    if (this.selectedDistrict !== 'ALL') {
      list = list.filter(d => d.district.toLowerCase() === this.selectedDistrict.toLowerCase());
    }

    // Filter by facility type
    if (this.selectedFacilityType !== 'ALL') {
      list = list.filter(d => d.facility_type === this.selectedFacilityType);
    }

    // Filter by free text search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.official_name.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.pincode.includes(q)
      );
    }

    // If user coordinates exist, sort by distance
    const userCoords = window.AAVIN_STORE.state.userCoords;
    if (userCoords) {
      list = [...list].sort((a, b) => {
        const distA = window.AAVIN_STORE.calculateDistance(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
        const distB = window.AAVIN_STORE.calculateDistance(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return list;
  },

  handleSearch(query) {
    this.searchQuery = query;
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  handleDistrictFilter(district) {
    this.selectedDistrict = district;
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  handleFacilityFilter(type) {
    this.selectedFacilityType = type;
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  resetFilters() {
    this.selectedDistrict = 'ALL';
    this.selectedFacilityType = 'ALL';
    this.searchQuery = '';
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  triggerNearestSearch() {
    this.isLocating = true;
    window.AAVIN_APP.renderCurrentView();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.isLocating = false;
          window.AAVIN_STORE.setUserCoordinates(pos.coords.latitude, pos.coords.longitude);
          alert(window.I18N.currentLang === 'ta' 
            ? `உங்கள் இருப்பிடம் கண்டறியப்பட்டது (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}). அருகிலுள்ள முதன்மை பால் பண்ணைகள் வரிசைப்படுத்தப்பட்டுள்ளன.`
            : `Location found! Dairies sorted by proximity to (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}).`
          );
        },
        (err) => {
          this.isLocating = false;
          console.warn('Geolocation error or denied. Using Madurai HQ fallback location.', err);
          // Fallback location: Madurai Collectorate coordinates for testing
          window.AAVIN_STORE.setUserCoordinates(9.9252, 78.1198);
          alert(window.I18N.currentLang === 'ta'
            ? 'ஜி.பி.எஸ் அனுமதி கிடைக்கவில்லை. மதுரை மையப் பகுதி அடிப்படையில் அருகிலுள்ள பால் பண்ணைகள் வரிசைப்படுத்தப்பட்டுள்ளன.'
            : 'GPS location unavailable. Sorted using Madurai Central as origin.'
          );
        },
        { timeout: 8000 }
      );
    } else {
      this.isLocating = false;
      window.AAVIN_STORE.setUserCoordinates(9.9252, 78.1198);
    }
  },

  initLeafletMap() {
    const mapEl = document.getElementById('dairyLeafletMap');
    if (!mapEl || typeof L === 'undefined') return;

    // Reset if already instantiated
    if (this.leafletMap) {
      try { this.leafletMap.remove(); } catch (e) {}
      this.leafletMap = null;
    }

    // Default center on Tamil Nadu geographic center
    this.leafletMap = L.map('dairyLeafletMap').setView([10.8505, 78.7047], 7);

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | Aavin Sangam'
    }).addTo(this.leafletMap);

    this.markersLayer = L.featureGroup().addTo(this.leafletMap);
    this.plotMarkers();
  },

  plotMarkers() {
    if (!this.leafletMap || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const dairies = this.getFilteredDairies();
    if (dairies.length === 0) return;

    const bounds = [];

    dairies.forEach(dairy => {
      if (!dairy.latitude || !dairy.longitude) return;

      const markerColor = dairy.facility_type === 'MAIN_DAIRY' ? '#0b4f8a' : (dairy.facility_type === 'FEEDER_BALANCING_DAIRY' ? '#15803d' : '#ea580c');

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-dairy-pin',
        html: `
          <div style="background: ${markerColor}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <span style="transform: rotate(45deg); font-size: 14px;">🥛</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([dairy.latitude, dairy.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="min-width: 220px; font-family: sans-serif; padding: 2px;">
          <div style="font-size: 11px; font-weight: 700; color: ${markerColor}; text-transform: uppercase;">
            ${dairy.facility_type.replace('_', ' ')}
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">
            ${dairy.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${dairy.address}
          </div>
          <div style="font-size: 11px; color: #0b4f8a; margin-top: 4px; font-weight: 600;">
            🏛️ ${dairy.union_name}
          </div>
          ${dairy.phone ? `<div style="font-size: 11px; margin-top: 4px;"><strong>📞 ${dairy.phone}</strong></div>` : ''}
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${dairy.latitude},${dairy.longitude}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0b4f8a; color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 700;">
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      this.markersLayer.addLayer(marker);
      bounds.push([dairy.latitude, dairy.longitude]);
    });

    if (bounds.length > 0) {
      this.leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  },

  refreshMap() {
    setTimeout(() => {
      this.initLeafletMap();
    }, 100);
  },

  /* --------------------------------------------------------------------------
     ADMIN CRUD MODALS
     -------------------------------------------------------------------------- */
  openAddModal() {
    const lang = window.I18N.currentLang;
    const modalHtml = `
      <div class="modal-dialog" style="max-width: 620px;">
        <div class="modal-header">
          <h3 style="font-size: 16px; color: var(--aavin-primary);">➕ Add Verified Aavin Main Dairy / Plant</h3>
          <button class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div style="background: #eff6ff; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #1e40af; margin-bottom: 12px;">
            ⚠️ <strong>STRICT FILTER</strong>: Add ONLY verified Main Dairies, Processing Units, or Feeder Balancing Dairies. Do NOT add BMCs, Chilling Centres, or Milk Booths.
          </div>

          <form id="addDairyForm" onsubmit="window.AAVIN_COMPONENTS.DairyFinder.handleSave(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Dairy Name *</label>
                <input type="text" id="dairyFormName" required placeholder="e.g. Madurai Aavin Main Dairy" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Facility Type *</label>
                <select id="dairyFormType" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
                  <option value="MAIN_DAIRY">Main Dairy</option>
                  <option value="FEEDER_BALANCING_DAIRY">Feeder Balancing Dairy</option>
                  <option value="DAIRY_PLANT">Dairy Plant</option>
                  <option value="PROCESSING_UNIT">Processing Unit</option>
                  <option value="SPECIALISED_DAIRY_PLANT">Specialised Dairy Plant</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="font-size: 12px; font-weight: 700;">Official Registered Name *</label>
              <input type="text" id="dairyFormOfficialName" required placeholder="e.g. Madurai District Cooperative Milk Producers Union Ltd" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">District *</label>
                <input type="text" id="dairyFormDistrict" required placeholder="e.g. Madurai" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">City *</label>
                <input type="text" id="dairyFormCity" required placeholder="e.g. Madurai" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Pincode *</label>
                <input type="text" id="dairyFormPincode" required placeholder="625020" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="font-size: 12px; font-weight: 700;">Full Physical Address *</label>
              <textarea id="dairyFormAddress" required rows="2" placeholder="e.g. Sivagangai Main Road, Sathamangalam, Madurai - 625020" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Latitude *</label>
                <input type="number" step="any" id="dairyFormLat" required placeholder="9.9248437" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Longitude *</label>
                <input type="number" step="any" id="dairyFormLng" required placeholder="78.1466085" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Phone</label>
                <input type="text" id="dairyFormPhone" placeholder="0452-2529561" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Official Email</label>
                <input type="email" id="dairyFormEmail" placeholder="admin@aavinmadurai.com" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Source Name *</label>
                <input type="text" id="dairyFormSourceName" required placeholder="Tamil Nadu Dairy Development Dept" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Source URL *</label>
                <input type="url" id="dairyFormSourceUrl" required placeholder="https://aavin.tn.gov.in" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 700;">Verification Status *</label>
              <select id="dairyFormStatus" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
                <option value="VERIFIED">✓ Verified</option>
                <option value="CROSS_VERIFIED">🔍 Cross-Verified</option>
                <option value="NEEDS_VERIFICATION">⚠ Needs Verification</option>
              </select>
            </div>

            <div class="modal-footer" style="padding: 10px 0 0 0; background: none; border-top: 1px solid #e2e8f0;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">💾 Save Main Dairy</button>
            </div>
          </form>
        </div>
      </div>
    `;
    window.AAVIN_APP.openModal(modalHtml);
  },

  handleSave(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('dairyFormName').value,
      official_name: document.getElementById('dairyFormOfficialName').value,
      facility_type: document.getElementById('dairyFormType').value,
      district: document.getElementById('dairyFormDistrict').value,
      city: document.getElementById('dairyFormCity').value,
      pincode: document.getElementById('dairyFormPincode').value,
      address: document.getElementById('dairyFormAddress').value,
      latitude: document.getElementById('dairyFormLat').value,
      longitude: document.getElementById('dairyFormLng').value,
      phone: document.getElementById('dairyFormPhone').value,
      email: document.getElementById('dairyFormEmail').value,
      source_name: document.getElementById('dairyFormSourceName').value,
      source_url: document.getElementById('dairyFormSourceUrl').value,
      verification_status: document.getElementById('dairyFormStatus').value
    };

    const res = window.AAVIN_STORE.addDairy(data);
    if (!res.success) {
      alert(res.error);
      return;
    }

    alert('Main Dairy added and verified successfully!');
    window.AAVIN_APP.closeModal();
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  openEditModal(id) {
    const dairy = window.AAVIN_STORE.state.dairies.find(d => d.id === id);
    if (!dairy) return;

    const modalHtml = `
      <div class="modal-dialog" style="max-width: 620px;">
        <div class="modal-header">
          <h3 style="font-size: 16px; color: var(--aavin-primary);">✏️ Edit Dairy: ${dairy.name}</h3>
          <button class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <form id="editDairyForm" onsubmit="window.AAVIN_COMPONENTS.DairyFinder.handleUpdate(event, '${dairy.id}')">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Dairy Name *</label>
                <input type="text" id="editFormName" required value="${dairy.name}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Facility Type *</label>
                <select id="editFormType" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
                  <option value="MAIN_DAIRY" ${dairy.facility_type === 'MAIN_DAIRY' ? 'selected' : ''}>Main Dairy</option>
                  <option value="FEEDER_BALANCING_DAIRY" ${dairy.facility_type === 'FEEDER_BALANCING_DAIRY' ? 'selected' : ''}>Feeder Balancing Dairy</option>
                  <option value="DAIRY_PLANT" ${dairy.facility_type === 'DAIRY_PLANT' ? 'selected' : ''}>Dairy Plant</option>
                  <option value="PROCESSING_UNIT" ${dairy.facility_type === 'PROCESSING_UNIT' ? 'selected' : ''}>Processing Unit</option>
                  <option value="SPECIALISED_DAIRY_PLANT" ${dairy.facility_type === 'SPECIALISED_DAIRY_PLANT' ? 'selected' : ''}>Specialised Dairy Plant</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="font-size: 12px; font-weight: 700;">Address *</label>
              <textarea id="editFormAddress" required rows="2" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">${dairy.address}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Latitude *</label>
                <input type="number" step="any" id="editFormLat" required value="${dairy.latitude}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Longitude *</label>
                <input type="number" step="any" id="editFormLng" required value="${dairy.longitude}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Phone</label>
                <input type="text" id="editFormPhone" value="${dairy.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Verification Status *</label>
                <select id="editFormStatus" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
                  <option value="VERIFIED" ${dairy.verification_status === 'VERIFIED' ? 'selected' : ''}>✓ Verified</option>
                  <option value="CROSS_VERIFIED" ${dairy.verification_status === 'CROSS_VERIFIED' ? 'selected' : ''}>🔍 Cross-Verified</option>
                  <option value="NEEDS_VERIFICATION" ${dairy.verification_status === 'NEEDS_VERIFICATION' ? 'selected' : ''}>⚠ Needs Verification</option>
                </select>
              </div>
            </div>

            <div class="modal-footer" style="padding: 10px 0 0 0; background: none; border-top: 1px solid #e2e8f0;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">💾 Update Details</button>
            </div>
          </form>
        </div>
      </div>
    `;
    window.AAVIN_APP.openModal(modalHtml);
  },

  handleUpdate(e, id) {
    e.preventDefault();
    const updated = {
      name: document.getElementById('editFormName').value,
      facility_type: document.getElementById('editFormType').value,
      address: document.getElementById('editFormAddress').value,
      latitude: document.getElementById('editFormLat').value,
      longitude: document.getElementById('editFormLng').value,
      phone: document.getElementById('editFormPhone').value,
      verification_status: document.getElementById('editFormStatus').value
    };

    window.AAVIN_STORE.updateDairy(id, updated);
    alert('Dairy details updated successfully!');
    window.AAVIN_APP.closeModal();
    window.AAVIN_APP.renderCurrentView();
    this.refreshMap();
  },

  handleDelete(id) {
    if (confirm('Are you sure you want to remove this dairy facility record?')) {
      window.AAVIN_STORE.deleteDairy(id);
      window.AAVIN_APP.renderCurrentView();
      this.refreshMap();
    }
  }
};
