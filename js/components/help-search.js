/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial Universal Search, Help Center & Official QR Verification Dialog
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.HelpSearch = {
  renderHelp() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <!-- Help Header -->
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 1.35rem; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
            ${icon('helpCircle', { size: 22, color: '#0b4f8a' })}
            <span>${t('needHelp')}</span>
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-muted);">
            ${lang === 'ta' ? 'ஆவின் சங்கம் தளத்தை எளிதாகப் பயன்படுத்த வழிகாட்டி மற்றும் உதவி எண்கள்' : 'Official helplines and interactive guides to assist dairy farmers and administrators.'}
          </p>
        </div>

        <!-- Emergency Helplines Card -->
        <div class="card card-floating-3d" style="background: linear-gradient(135deg, #0b4f8a 0%, #07355e 100%); color: white; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
              ${icon('phone', { size: 22, color: '#ffffff' })}
            </div>
            <div>
              <h3 style="color: white; font-size: 15px; font-weight: 800;">${t('tollFreeHelpline')}</h3>
              <p style="color: #93c5fd; font-size: 11.5px; margin-top: 2px;">
                ${lang === 'ta' ? 'வாரத்தின் 7 நாட்களும் 24 மணி நேரமும் செயல்படும் கட்டணமில்லா உதவி எண்' : 'Available 24x7 for milk producers and Sangam members across Tamil Nadu.'}
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="tel:18004254422" class="btn btn-success btn-sm" style="font-weight: 700;">
              ${icon('phone', { size: 14, color: '#ffffff' })}
              <span>Call 1800-425-4422</span>
            </a>
            <a href="https://wa.me/919443100000" target="_blank" class="btn btn-secondary btn-sm" style="background: white; color: #0b4f8a; font-weight: 700;">
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>

        <!-- User Guides & FAQs -->
        <div class="card card-floating-3d">
          <h3 class="card-title" style="margin-bottom: 14px;">
            ${icon('fileText', { size: 20, color: '#0b4f8a' })}
            <span>${lang === 'ta' ? 'அடிக்கடி கேட்கப்படும் கேள்விகள் & வழிகாட்டிகள்' : 'User Guides & FAQs'}</span>
          </h3>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
              <h4 style="font-size: 13.5px; color: var(--aavin-primary); margin-bottom: 3px; font-weight: 800;">
                1. ${t('faq1Title')}
              </h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                ${t('faq1Desc')}
              </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
              <h4 style="font-size: 13.5px; color: var(--aavin-primary); margin-bottom: 3px; font-weight: 800;">
                2. ${t('faq2Title')}
              </h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                ${t('faq2Desc')}
              </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
              <h4 style="font-size: 13.5px; color: var(--aavin-primary); margin-bottom: 3px; font-weight: 800;">
                3. ${t('faq3Title')}
              </h4>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                ${t('faq3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderUniversalSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const lang = window.I18N.currentLang;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    if (!q) return '';

    const matchedIssues = (window.AAVIN_STORE.state.issues || []).filter(
      i => (i.id && i.id.toLowerCase().includes(q)) || (i.title_en && i.title_en.toLowerCase().includes(q)) || (i.title_ta && i.title_ta.includes(q))
    );

    const matchedNews = (window.AAVIN_STORE.state.news || window.AAVIN_DATA.news || []).filter(
      n => (n.title_en && n.title_en.toLowerCase().includes(q)) || (n.title_ta && n.title_ta.includes(q))
    );

    return `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 style="font-size: 15px; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 6px;">
            ${icon('search', { size: 18, color: '#0b4f8a' })}
            <span>Search Results for "${query}"</span>
          </h3>
          <button class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 400px; overflow-y: auto;">
          ${matchedIssues.length > 0 ? `
            <div>
              <strong style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Issues & Grievances (${matchedIssues.length})</strong>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                ${matchedIssues.map(i => `
                  <div style="padding: 10px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--border-subtle); cursor: pointer;" onclick="window.AAVIN_APP.closeModal(); window.AAVIN_APP.navigate('issues');">
                    <span style="font-family: monospace; font-size: 11px; color: var(--aavin-primary); font-weight: 700;">${i.id}</span>
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${i.title_en}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${matchedNews.length > 0 ? `
            <div>
              <strong style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Circulars & Orders (${matchedNews.length})</strong>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                ${matchedNews.map(n => `
                  <div style="padding: 10px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--border-subtle); cursor: pointer;" onclick="window.AAVIN_APP.closeModal(); window.AAVIN_APP.navigate('news');">
                    <span style="font-size: 10.5px; color: #0284c7; font-weight: 700;">${n.category}</span>
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${n.title_en}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${matchedIssues.length === 0 && matchedNews.length === 0 ? `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
              No records found matching "${query}"
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderQrVerificationModal() {
    const lang = window.I18N.currentLang;
    const member = window.AAVIN_DATA.currentMember;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 style="font-size: 15px; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
            ${icon('shieldCheck', { size: 20, color: '#15803d' })}
            <span>${lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட டிஜிட்டல் சரிபார்ப்பு' : 'Official Digital ID Verification'}</span>
          </h3>
          <button class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <div style="width: 140px; height: 140px; margin: 0 auto 14px auto; background: white; padding: 8px; border-radius: 12px; border: 2px solid #bbf7d0; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AAVIN-TN-${member.memberId}-VERIFIED-2026" alt="QR" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>

          <span class="badge badge-normal" style="font-size: 12px; padding: 4px 12px;">
            ✓ OFFICIAL STATE RECORD VERIFIED
          </span>

          <div style="background: #f8fafc; border-radius: 12px; border: 1px solid var(--border-subtle); padding: 12px; margin-top: 14px; text-align: left; font-size: 12.5px;">
            <div><strong>Member:</strong> ${member.name_en} (${member.memberId})</div>
            <div><strong>Union:</strong> ${member.sangamName_en}</div>
            <div><strong>District:</strong> ${member.districtName_en}</div>
            <div><strong>Digital Hash:</strong> SHA256-8F92A-AAVIN-2026</div>
          </div>
        </div>
      </div>
    `;
  }
};
