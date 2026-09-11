/**
 * AAVIN MAIN DAIRY EXPLORER
 * Live Search Autocomplete & "Find Nearby Dairy" GPS Proximity Engine
 */

window.AAVIN_SEARCH_NEARBY = {
  searchDebounceTimer: null,

  handleSearchInput(query) {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.executeSearch(query);
    }, 180);
  },

  executeSearch(query) {
    const q = (query || '').trim().toLowerCase();
    const dropdown = document.getElementById('heroSearchDropdown');
    if (!dropdown) return;

    if (!q) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const dairies = window.AAVIN_DAIRY_DATA || [];
    const results = dairies.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.union_name.toLowerCase().includes(q) ||
      d.pincode.includes(q)
    );

    if (results.length === 0) {
      dropdown.style.display = 'block';
      dropdown.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">
          🏢 No verified main dairies found matching "<strong>${query}</strong>".<br>
          <span style="font-size:11px; opacity:0.8;">Note: BMCs, chilling centres, and booths are excluded.</span>
        </div>
      `;
      return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = `
      <div style="padding:10px 14px 6px; font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f1f5f9;">
        Found ${results.length} Verified Facilities
      </div>
      <div style="max-height:300px; overflow-y:auto;">
        ${results.map(d => `
          <div class="search-result-item" onclick="window.AAVIN_SEARCH_NEARBY.selectSearchResult('${d.id}')" style="padding:10px 14px; cursor:pointer; border-bottom:1px solid #f8fafc; transition:background 0.15s ease; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-weight:700; font-size:14px; color:var(--aavin-forest);">${d.name}</div>
              <div style="font-size:11.5px; color:var(--text-muted);">📍 ${d.district} • ${d.facility_type.replace(/_/g, ' ')}</div>
            </div>
            <span style="font-size:11px; color:var(--aavin-blue); font-weight:700;">View in 3D →</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  selectSearchResult(dairyId) {
    const dropdown = document.getElementById('heroSearchDropdown');
    if (dropdown) dropdown.style.display = 'none';

    window.AAVIN_EXPLORER.focusDairyOnMap(dairyId);

    // Smooth scroll to 3D map
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  triggerNearbySearch() {
    const btn = document.getElementById('findNearbyBtn');
    if (btn) btn.innerHTML = '<span>⏳</span> Locating...';

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.processLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation failed or denied. Falling back to Madurai Central origin.', err);
          // Fallback: Madurai Central coordinates
          this.processLocation(9.9252, 78.1198, true);
        },
        { timeout: 7000 }
      );
    } else {
      this.processLocation(9.9252, 78.1198, true);
    }
  },

  processLocation(lat, lng, isFallback = false) {
    const btn = document.getElementById('findNearbyBtn');
    if (btn) btn.innerHTML = '<span>📍</span> Find Nearby';

    if (window.AAVIN_STORE && window.AAVIN_STORE.setUserCoordinates) {
      window.AAVIN_STORE.setUserCoordinates(lat, lng);
    }

    const dairies = window.AAVIN_DAIRY_DATA || [];
    if (dairies.length === 0) return;

    // Calculate distance for all dairies
    const sorted = [...dairies].sort((a, b) => {
      const distA = this.calculateHaversine(lat, lng, a.latitude, a.longitude);
      const distB = this.calculateHaversine(lat, lng, b.latitude, b.longitude);
      return distA - distB;
    });

    const nearest = sorted[0];
    const nearestKm = this.calculateHaversine(lat, lng, nearest.latitude, nearest.longitude);

    // Alert user
    const notice = isFallback 
      ? `GPS unavailable. Sorted using Madurai HQ as origin. Nearest plant is ${nearest.name} (${nearestKm.toFixed(1)} km away).`
      : `Location detected (${lat.toFixed(2)}, ${lng.toFixed(2)}). Nearest verified facility is ${nearest.name} (${nearestKm.toFixed(1)} km away).`;

    alert(notice);

    // Focus 3D map on nearest plant
    window.AAVIN_EXPLORER.focusDairyOnMap(nearest.id);

    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Refresh directory cards to display proximity
    window.AAVIN_EXPLORER.renderDirectoryCards();
  },

  calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
};
