/**
 * AAVIN MAIN DAIRY EXPLORER
 * District Explorer Component with 3D Tilt Cards
 */

window.AAVIN_DISTRICT_EXPLORER = {
  // District Tamil Names Mapping
  DISTRICT_NAMES_TA: {
    'Chennai': 'சென்னை',
    'Madurai': 'மதுரை',
    'Coimbatore': 'கோயம்புத்தூர்',
    'Salem': 'சேலம்',
    'Tiruchirappalli': 'திருச்சிராப்பள்ளி',
    'Erode': 'ஈரோடு',
    'Tirunelveli': 'திருநெல்வேலி',
    'Vellore': 'வேலூர்',
    'Thanjavur': 'தஞ்சாவூர்',
    'Dindigul': 'திண்டுக்கல்',
    'Nilgiris': 'நீலகிரி',
    'Dharmapuri': 'தருமபுரி',
    'Villupuram': 'விழுப்புரம்',
    'Virudhunagar': 'விருதுநகர்',
    'Cuddalore': 'கடலூர்',
    'Sivagangai': 'சிவகங்கை',
    'Kanchipuram': 'காஞ்சிபுரம்',
    'Tiruvannamalai': 'திருவண்ணாமலை'
  },

  render(dairies) {
    const districtsMap = {};

    dairies.forEach(d => {
      if (!districtsMap[d.district]) {
        districtsMap[d.district] = {
          name: d.district,
          name_ta: this.DISTRICT_NAMES_TA[d.district] || d.district,
          plants: [],
          types: new Set()
        };
      }
      districtsMap[d.district].plants.push(d);
      districtsMap[d.district].types.add(d.facility_type);
    });

    const districtsList = Object.values(districtsMap).sort((a, b) => b.plants.length - a.plants.length);

    return `
      <div class="district-explorer-section" id="districts">
        <div class="section-header">
          <span class="section-tag">District Hubs</span>
          <h2 class="section-title">Tamil Nadu District Explorer</h2>
          <p class="section-desc">
            Explore Aavin main processing facilities categorized by cooperative union districts. Click any district to focus the 3D map.
          </p>
        </div>

        <div class="district-cards-grid">
          ${districtsList.map(dist => this.renderDistrictCard(dist)).join('')}
        </div>
      </div>
    `;
  },

  renderDistrictCard(dist) {
    const initial = dist.name.charAt(0);
    const typesCount = dist.types.size;

    return `
      <div class="district-card-3d" onclick="window.AAVIN_EXPLORER.focusDistrictOnMap('${dist.name}')" onmousemove="window.AAVIN_DISTRICT_EXPLORER.handle3DTilt(event, this)" onmouseleave="window.AAVIN_DISTRICT_EXPLORER.reset3DTilt(this)">
        <div class="district-card-top">
          <div class="district-avatar">
            ${initial}
          </div>
          <span class="badge-pill badge-verified">
            ${dist.plants.length} ${dist.plants.length === 1 ? 'Plant' : 'Plants'}
          </span>
        </div>

        <div class="district-name">${dist.name}</div>
        <div class="district-name-ta">${dist.name_ta}</div>

        <div style="font-size:12px; color:var(--text-muted); margin-top:10px; line-height:1.4;">
          ${dist.plants.map(p => p.name).join(' • ')}
        </div>

        <div class="district-plants-meta">
          <span style="color:var(--aavin-forest); font-weight:700;">
            ${typesCount} Facility ${typesCount === 1 ? 'Type' : 'Types'}
          </span>
          <span style="color:var(--aavin-blue); font-weight:700;">
            Focus 3D Map →
          </span>
        </div>
      </div>
    `;
  },

  handle3DTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  },

  reset3DTilt(card) {
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
  }
};
