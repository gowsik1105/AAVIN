/**
 * AAVIN MAIN DAIRY EXPLORER
 * Floating Glassmorphic 3D Card, Directory Grid & Details Modal
 */

window.AAVIN_DAIRY_CARDS = {
  activeDairy: null,

  renderFloatingCard(dairy, userCoords, lang = 'en') {
    if (!dairy) return '';

    const t = (k) => window.I18N ? window.I18N.t(k) : k;

    let distanceHtml = '';
    if (userCoords && window.AAVIN_STORE && window.AAVIN_STORE.calculateDistance) {
      const distKm = window.AAVIN_STORE.calculateDistance(
        userCoords.latitude, userCoords.longitude,
        dairy.latitude, dairy.longitude
      );
      distanceHtml = `
        <span class="badge-pill" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">
          📍 ${distKm.toFixed(1)} km away
        </span>
      `;
    }

    const typeConfig = this.getFacilityBadgeConfig(dairy.facility_type);

    return `
      <div class="floating-dairy-card active" id="floatingDairyCard">
        <button class="card-close-btn" onclick="window.AAVIN_EXPLORER.closeFloatingCard()" title="Close Card">✕</button>

        <div class="floating-card-header">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <span class="badge-pill ${typeConfig.badgeClass}">
              ${typeConfig.icon} ${typeConfig.label}
            </span>
            <span class="badge-pill badge-verified">
              ✓ Verified
            </span>
          </div>

          <h3 class="floating-dairy-title">${dairy.name}</h3>
          <div class="floating-dairy-union">${dairy.official_name}</div>
        </div>

        <div class="floating-dairy-meta">
          <div>📍 <strong>${dairy.address}</strong></div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
            District: <strong>${dairy.district}</strong> • Pincode: <strong>${dairy.pincode}</strong>
          </div>
          ${dairy.phone ? `<div style="margin-top:4px;">📞 <a href="tel:${dairy.phone}" style="color:var(--aavin-blue); font-weight:700; text-decoration:none;">${dairy.phone}</a></div>` : ''}
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between;">
          ${distanceHtml}
          <span style="font-size:11px; color:var(--text-muted);">Capacity: <strong>Main Plant</strong></span>
        </div>

        <div class="floating-card-actions">
          <button class="btn-explorer btn-explorer-primary" style="flex:1;" onclick="window.AAVIN_DAIRY_CARDS.openDetailsModal('${dairy.id}')">
            <span>🔍</span> View Details
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${dairy.latitude},${dairy.longitude}" target="_blank" rel="noopener noreferrer" class="btn-explorer btn-explorer-secondary" style="flex:1;">
            <span>🧭</span> Directions
          </a>
        </div>
      </div>
    `;
  },

  renderDirectoryCard(dairy, userCoords, lang = 'en') {
    const typeConfig = this.getFacilityBadgeConfig(dairy.facility_type);

    let distBadge = '';
    if (userCoords && window.AAVIN_STORE && window.AAVIN_STORE.calculateDistance) {
      const dist = window.AAVIN_STORE.calculateDistance(
        userCoords.latitude, userCoords.longitude,
        dairy.latitude, dairy.longitude
      );
      distBadge = `<span class="badge-pill" style="background:#e0f2fe; color:#0369a1;">📍 ${dist.toFixed(1)} km</span>`;
    }

    return `
      <div class="dairy-item-card" id="dairy-card-${dairy.id}">
        <div>
          <div class="dairy-item-top">
            <span class="badge-pill ${typeConfig.badgeClass}">
              ${typeConfig.icon} ${typeConfig.label}
            </span>
            ${distBadge || `<span class="badge-pill badge-verified">✓ Verified</span>`}
          </div>

          <h3 class="dairy-item-title">${dairy.name}</h3>
          <div class="dairy-item-official">${dairy.official_name}</div>

          <div class="dairy-item-address">
            <div>📍 ${dairy.address}</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:3px;">
              District: <strong>${dairy.district}</strong> • Pincode: <strong>${dairy.pincode}</strong>
            </div>
          </div>
        </div>

        <div>
          <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:12px; display:flex; justify-content:space-between;">
            <span>🏛️ ${dairy.union_name}</span>
            ${dairy.phone ? `<span>📞 ${dairy.phone}</span>` : ''}
          </div>

          <div class="dairy-item-footer">
            <button class="btn-explorer btn-explorer-secondary" style="padding:6px 12px; font-size:12px;" onclick="window.AAVIN_EXPLORER.focusDairyOnMap('${dairy.id}')">
              <span>🗺️</span> 3D Map
            </button>
            <button class="btn-explorer btn-explorer-primary" style="padding:6px 12px; font-size:12px;" onclick="window.AAVIN_DAIRY_CARDS.openDetailsModal('${dairy.id}')">
              Details →
            </button>
          </div>
        </div>
      </div>
    `;
  },

  openDetailsModal(dairyId) {
    const dairies = window.AAVIN_DAIRY_DATA || [];
    const dairy = dairies.find(d => d.id === dairyId);
    if (!dairy) return;

    const typeConfig = this.getFacilityBadgeConfig(dairy.facility_type);

    const modalHtml = `
      <div class="modal-overlay active" id="dairyDetailsModal" onclick="if(event.target===this) window.AAVIN_DAIRY_CARDS.closeDetailsModal()">
        <div class="modal-card">
          <button class="card-close-btn" onclick="window.AAVIN_DAIRY_CARDS.closeDetailsModal()">✕</button>

          <!-- Modal Header -->
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span class="badge-pill ${typeConfig.badgeClass}">
              ${typeConfig.icon} ${typeConfig.label}
            </span>
            <span class="badge-pill badge-verified">
              ✓ Authoritatively Verified
            </span>
          </div>

          <h2 style="font-size:22px; font-weight:800; color:var(--aavin-forest); line-height:1.2;">
            ${dairy.name}
          </h2>
          <div style="font-size:13px; color:var(--text-muted); font-weight:600; margin-top:3px;">
            ${dairy.official_name}
          </div>

          <!-- Key Details Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0;">
            <div style="background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">District / City</span>
              <div style="font-weight:700; color:var(--text-primary); font-size:14px; margin-top:2px;">
                ${dairy.district} • ${dairy.city}
              </div>
            </div>

            <div style="background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Pincode</span>
              <div style="font-weight:700; color:var(--text-primary); font-size:14px; margin-top:2px;">
                ${dairy.pincode}
              </div>
            </div>

            <div style="background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0; grid-column:1 / -1;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Address</span>
              <div style="font-weight:600; color:var(--text-primary); font-size:13px; margin-top:2px;">
                📍 ${dairy.address}
              </div>
            </div>

            <div style="background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0; grid-column:1 / -1;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Operating Union</span>
              <div style="font-weight:700; color:var(--aavin-forest); font-size:13.5px; margin-top:2px;">
                🏛️ ${dairy.union_name}
              </div>
            </div>
          </div>

          <!-- Contact & Coordinates -->
          <div style="margin-bottom:20px; font-size:13px; display:flex; flex-direction:column; gap:8px;">
            ${dairy.phone ? `<div>📞 <strong>Phone:</strong> <a href="tel:${dairy.phone}" style="color:var(--aavin-blue); font-weight:700; text-decoration:none;">${dairy.phone}</a></div>` : ''}
            ${dairy.email ? `<div>✉️ <strong>Email:</strong> <a href="mailto:${dairy.email}" style="color:var(--aavin-blue); text-decoration:none;">${dairy.email}</a></div>` : ''}
            ${dairy.website ? `<div>🌐 <strong>Official Website:</strong> <a href="${dairy.website}" target="_blank" rel="noopener noreferrer" style="color:var(--aavin-blue); text-decoration:none;">${dairy.website}</a></div>` : ''}
            <div style="color:var(--text-muted); font-size:12px;">
              🧭 <strong>GPS Coordinates:</strong> ${dairy.latitude}, ${dairy.longitude}
            </div>
          </div>

          <!-- Source Provenance Notice -->
          <div style="background:#ecfdf5; border:1.5px solid #a7f3d0; border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:20px;">
            <div style="font-size:11px; font-weight:800; color:#065f46; text-transform:uppercase; letter-spacing:0.5px;">
              Authoritative Verification Source
            </div>
            <div style="font-size:12.5px; color:#047857; margin-top:2px;">
              ${dairy.source_name}
            </div>
            <a href="${dairy.source_url}" target="_blank" rel="noopener noreferrer" style="font-size:11.5px; color:#059669; font-weight:700; text-decoration:underline; display:inline-block; margin-top:4px;">
              View Official Reference Portal →
            </a>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:10px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${dairy.latitude},${dairy.longitude}" target="_blank" rel="noopener noreferrer" class="btn-explorer btn-explorer-primary" style="flex:1; padding:12px;">
              <span>🧭</span> Open Google Maps Navigation
            </a>
            <button class="btn-explorer btn-explorer-secondary" onclick="window.AAVIN_DAIRY_CARDS.closeDetailsModal(); window.AAVIN_EXPLORER.focusDairyOnMap('${dairy.id}');">
              <span>🗺️</span> View in 3D Map
            </button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('modalContainer');
    if (container) {
      container.innerHTML = modalHtml;
    }
  },

  closeDetailsModal() {
    const container = document.getElementById('modalContainer');
    if (container) {
      container.innerHTML = '';
    }
  },

  getFacilityBadgeConfig(type) {
    switch (type) {
      case 'MAIN_DAIRY':
        return { label: 'Main Dairy', icon: '🏢', badgeClass: 'badge-facility-main' };
      case 'FEEDER_BALANCING_DAIRY':
        return { label: 'Feeder Balancing', icon: '⚡', badgeClass: 'badge-facility-feeder' };
      case 'DAIRY_PLANT':
        return { label: 'Dairy Plant', icon: '🏭', badgeClass: 'badge-facility-plant' };
      case 'PROCESSING_UNIT':
        return { label: 'Processing Unit', icon: '⚙️', badgeClass: 'badge-facility-process' };
      case 'SPECIALISED_DAIRY_PLANT':
        return { label: 'Specialised / Ice Cream', icon: '🍦', badgeClass: 'badge-facility-special' };
      default:
        return { label: 'Main Dairy', icon: '🏢', badgeClass: 'badge-facility-main' };
    }
  }
};
