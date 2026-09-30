/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial News, Circulars & Official Government Announcements Channel
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.NewsChannel = {
  activeCategory: 'all',
  searchQuery: '',

  filterCategory(cat) {
    this.activeCategory = cat;
    const container = document.getElementById('newsFeedGrid');
    if (container) {
      container.innerHTML = this.renderNewsCards();
    }
    document.querySelectorAll('.filter-chip').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === cat);
    });
  },

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase();
    const container = document.getElementById('newsFeedGrid');
    if (container) {
      container.innerHTML = this.renderNewsCards();
    }
  },

  renderNewsCards() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const allNews = window.AAVIN_STORE.state.news || window.AAVIN_DATA.news || [];
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    
    let filtered = allNews;
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(n => n.category === this.activeCategory);
    }
    if (this.searchQuery) {
      filtered = filtered.filter(n => 
        (n.title_en && n.title_en.toLowerCase().includes(this.searchQuery)) ||
        (n.title_ta && n.title_ta.includes(this.searchQuery)) ||
        (n.content_en && n.content_en.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      return `
        <div class="card card-floating-3d hover-lift" style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; border: 1.5px dashed var(--border-strong); background: #fafcff;">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
            ${icon('news', { size: 28, color: '#0284c7' })}
          </div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
            ${lang === 'ta' ? 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை' : 'No Announcements Found'}
          </h3>
          <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; max-width: 380px; margin: 0 auto;">
            ${lang === 'ta' ? 'தேடல் சொற்களை மாற்றவோ அல்லது வேறு பிரிவைத் தேர்வு செய்யவோ முயற்சிக்கவும்.' : 'Try searching with different keywords or selecting another category filter.'}
          </p>
        </div>
      `;
    }

    return filtered.map(item => `
      <div class="card card-floating-3d hover-lift" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Card Category Badge & Date -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 700;">
              ${this.getCategoryLabel(item.category, lang)}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px;">
              ${icon('clock', { size: 11, color: 'currentColor' })}
              <span>${item.date}</span>
            </span>
          </div>

          <!-- Title -->
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); line-height: 1.35; margin-bottom: 6px;">
            ${lang === 'ta' ? item.title_ta : item.title_en}
          </h4>

          <!-- Authority -->
          <div style="font-size: 11px; color: var(--aavin-primary); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
            ${icon('gov', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? item.authority_ta : item.authority_en}</span>
          </div>

          <!-- Content snippet -->
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45; margin-bottom: 12px;">
            ${lang === 'ta' ? item.content_ta : item.content_en}
          </p>
        </div>

        <!-- Attachment Download Link (if any) -->
        ${item.hasDoc ? `
          <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #334155; font-weight: 600;">
              ${icon('fileText', { size: 14, color: '#0b4f8a' })}
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${item.docName || 'Govt_Order_2026.pdf'}</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.showToast('Downloaded: ' + '${item.docName || 'Govt_Order.pdf'}')">
              ${icon('download', { size: 12, color: 'currentColor' })}
              <span>${lang === 'ta' ? 'பதிவிறக்கு' : 'Download'}</span>
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  getCategoryLabel(categoryKey, lang) {
    switch(categoryKey) {
      case 'government_updates':
        return lang === 'ta' ? 'அரசு ஆணை (GO)' : 'Govt Order';
      case 'aavin_updates':
        return lang === 'ta' ? 'ஆவின் செய்தி' : 'Aavin News';
      case 'district_news':
        return lang === 'ta' ? 'மாவட்ட செய்தி' : 'District Update';
      case 'events':
        return lang === 'ta' ? 'நிகழ்வுகள்' : 'Events';
      default:
        return lang === 'ta' ? 'பொது அறிவிப்பு' : 'Notice';
    }
  },

  render() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 860px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.35rem; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
              ${icon('news', { size: 22, color: '#0b4f8a' })}
              <span>${t('navDocuments')}</span>
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${lang === 'ta' ? 'அரசாணைகள், சுற்றறிக்கைகள் மற்றும் ஆவின் நலத்திட்டங்கள்' : 'Verified Tamil Nadu Government Orders, Circulars & Welfare Schemes'}
            </p>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="position: relative; margin-bottom: 12px;">
          <input 
            type="text" 
            placeholder="${lang === 'ta' ? 'அரசாணைகள் அல்லது செய்திகளை தேடுங்கள்...' : 'Search circulars, GO numbers, or welfare schemes...'}"
            style="width: 100%; padding: 10px 14px 10px 38px; border-radius: var(--radius-md); border: 1.5px solid var(--border-strong); font-size: 13px; background: #ffffff; outline: none;"
            oninput="window.AAVIN_COMPONENTS.NewsChannel.setSearch(this.value)"
          />
          <span style="position: absolute; left: 12px; top: 11px; color: var(--text-muted);">
            ${icon('search', { size: 16, color: 'currentColor' })}
          </span>
        </div>

        <!-- Filter Chips Bar -->
        <div class="chip-scroll-row" style="margin-bottom: 16px;">
          <button class="filter-chip ${this.activeCategory === 'all' ? 'active' : ''}" data-category="all" onclick="window.AAVIN_COMPONENTS.NewsChannel.filterCategory('all')">
            ${lang === 'ta' ? 'அனைத்தும்' : 'All Updates'}
          </button>
          <button class="filter-chip ${this.activeCategory === 'government_updates' ? 'active' : ''}" data-category="government_updates" onclick="window.AAVIN_COMPONENTS.NewsChannel.filterCategory('government_updates')">
            ${lang === 'ta' ? 'அரசாணைகள் (GOs)' : 'Govt Orders'}
          </button>
          <button class="filter-chip ${this.activeCategory === 'aavin_updates' ? 'active' : ''}" data-category="aavin_updates" onclick="window.AAVIN_COMPONENTS.NewsChannel.filterCategory('aavin_updates')">
            ${lang === 'ta' ? 'ஆவின் செய்திகள்' : 'Aavin News'}
          </button>
          <button class="filter-chip ${this.activeCategory === 'district_news' ? 'active' : ''}" data-category="district_news" onclick="window.AAVIN_COMPONENTS.NewsChannel.filterCategory('district_news')">
            ${lang === 'ta' ? 'மாவட்ட சுற்றறிக்கை' : 'District Circulars'}
          </button>
        </div>

        <!-- Grid Cards -->
        <div id="newsFeedGrid" class="grid-2">
          ${this.renderNewsCards()}
        </div>
      </div>
    `;
  }
};
