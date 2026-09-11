/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial-Grade Member Home Dashboard
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.MemberHome = {
  render() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const member = window.AAVIN_DATA.currentMember;
    const issues = window.AAVIN_STORE.state.issues || [];
    const news = window.AAVIN_STORE.state.news || window.AAVIN_DATA.news || [];
    const meetings = window.AAVIN_STORE.state.meetings || window.AAVIN_DATA.meetings || [];
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    // Calculate dynamic issue metrics
    const submittedCount = issues.filter(i => i.status === 'submitted').length;
    const underReviewCount = issues.filter(i => i.status === 'admin_verification' || i.status === 'verified').length;
    const inProgressCount = issues.filter(i => i.status === 'forwarded' || i.status === 'action_in_progress').length;
    const resolvedCount = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

    // Greeting logic
    const hour = new Date().getHours();
    let greetingText = lang === 'ta' ? 'காலை வணக்கம்' : 'Good Morning';
    if (hour >= 12 && hour < 17) greetingText = lang === 'ta' ? 'மதிய வணக்கம்' : 'Good Afternoon';
    else if (hour >= 17) greetingText = lang === 'ta' ? 'மாலை வணக்கம்' : 'Good Evening';

    return `
      <!-- Location Ribbon & Breadcrumb -->
      <div class="location-ribbon">
        <div class="location-pin-wrap">
          ${icon('pin', { size: 18, color: '#0b4f8a' })}
          <span>${lang === 'ta' ? member.districtName_ta : member.districtName_en}</span>
          <span style="color: var(--text-muted); font-weight: 400;">•</span>
          <span style="color: var(--text-secondary); font-size: 13px;">${lang === 'ta' ? member.sangamName_ta : member.sangamName_en}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
            ${icon('map', { size: 14, color: '#0b4f8a' })}
            <span>${lang === 'ta' ? 'பண்ணை வரைபடம்' : 'Dairy Map'}</span>
          </button>
        </div>
      </div>

      <!-- Hero Personalized Greeting Card -->
      <div class="card card-floating-3d" style="margin-bottom: 20px; background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 60%, #e0effe 100%); border-left: 5px solid var(--aavin-primary);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 60px; height: 60px; border-radius: 16px; overflow: hidden; border: 2px solid white; box-shadow: 0 4px 14px rgba(11, 79, 138, 0.25); background: #ffffff; flex-shrink: 0;">
              <img src="assets/logo.jpg" alt="Aavin Member" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 800; color: var(--aavin-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                ${greetingText}
              </div>
              <h2 style="font-size: 1.35rem; color: var(--text-primary); font-weight: 800; margin-top: 1px;">
                ${lang === 'ta' ? member.name_ta : member.name_en}
              </h2>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap;">
                <span><strong>ID:</strong> ${member.memberId}</span>
                <span>•</span>
                <span class="badge badge-normal">${icon('check', { size: 12, color: '#15803d' })} ${lang === 'ta' ? 'உறுப்பினர் சரிபார்க்கப்பட்டது' : 'Verified Member'}</span>
              </div>
            </div>
          </div>

          <div>
            <button class="btn btn-primary" onclick="window.AAVIN_APP.navigate('digital_id')">
              ${icon('digitalId', { size: 16, color: '#ffffff' })}
              <span>${lang === 'ta' ? 'டிஜிட்டல் அட்டை' : 'Digital ID'}</span>
              ${icon('arrowRight', { size: 14, color: '#ffffff' })}
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid (4 Native Style Cards) -->
      <div style="margin-bottom: 22px;">
        <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          ${icon('zap', { size: 18, color: '#d97706' })}
          <span>${lang === 'ta' ? 'விரைவு செயல்பாடுகள்' : 'Quick Actions'}</span>
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
          
          <div class="btn-action-3d" onclick="window.AAVIN_APP.navigate('digital_id')">
            <div class="action-icon-wrap" style="background: #fef3c7; color: #d97706;">
              ${icon('digitalId', { size: 24, color: '#d97706' })}
            </div>
            <strong style="font-size: 13px; color: var(--text-primary);">${t('navDigitalId')}</strong>
            <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Smart ID</span>
          </div>

          <div class="btn-action-3d" onclick="window.AAVIN_APP.navigate('issues', { action: 'report' })">
            <div class="action-icon-wrap" style="background: #fee2e2; color: #dc2626;">
              ${icon('issues', { size: 24, color: '#dc2626' })}
            </div>
            <strong style="font-size: 13px; color: var(--text-primary);">${t('reportIssueBtn')}</strong>
            <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Step Wizard</span>
          </div>

          <div class="btn-action-3d" onclick="window.AAVIN_APP.navigate('meetings')">
            <div class="action-icon-wrap" style="background: #e0f2fe; color: #0284c7;">
              ${icon('meetings', { size: 24, color: '#0284c7' })}
            </div>
            <strong style="font-size: 13px; color: var(--text-primary);">${t('navMeetings')}</strong>
            <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Live Video</span>
          </div>

          <div class="btn-action-3d" onclick="window.AAVIN_APP.navigate('news')">
            <div class="action-icon-wrap" style="background: #dcfce7; color: #15803d;">
              ${icon('news', { size: 24, color: '#15803d' })}
            </div>
            <strong style="font-size: 13px; color: var(--text-primary);">${t('navDocuments')}</strong>
            <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Govt Orders</span>
          </div>

        </div>
      </div>

      <!-- 2-Column Main Layout: My Sangam + Latest Updates -->
      <div class="grid-2" style="margin-bottom: 22px;">

        <!-- Section 1: My Sangam Card -->
        <div class="card card-floating-3d">
          <div class="card-header">
            <h3 class="card-title">
              ${icon('gov', { size: 20, color: '#0b4f8a' })}
              <span>${lang === 'ta' ? 'என் சங்கம் & நிர்வாகிகள்' : 'My Sangam & Bearers'}</span>
            </h3>
            <span class="badge badge-normal">${icon('check', { size: 10, color: '#15803d' })} ${lang === 'ta' ? 'பதிவு செய்யப்பட்டது' : 'Registered'}</span>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 12px; border: 1px solid var(--border-subtle); margin-bottom: 12px;">
            <div style="font-weight: 800; font-size: 14.5px; color: var(--aavin-primary);">
              ${lang === 'ta' ? member.sangamName_ta : member.sangamName_en}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
              📍 Aavin Dairy Complex, Sathamangalam, Madurai - 625020
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
              <strong>${lang === 'ta' ? 'இணைக்கப்பட்ட பண்ணை:' : 'Main Dairy:'}</strong> ${member.dairyName_en || 'Aavin Madurai Main Dairy'}
            </div>
          </div>

          <!-- Office Bearers List -->
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: var(--text-muted); font-weight: 600;">${t('president')}:</span>
              <span style="font-weight: 700; color: var(--text-primary);">${lang === 'ta' ? 'திரு. கே. முத்துப்பாண்டி' : 'Thiru K. Muthupandi'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="color: var(--text-muted); font-weight: 600;">${t('secretary')}:</span>
              <span style="font-weight: 700; color: var(--text-primary);">${lang === 'ta' ? 'திரு. எஸ். பழனிவேல்' : 'Thiru S. Palanivel'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
              <span style="color: var(--text-muted); font-weight: 600;">${t('treasurer')}:</span>
              <span style="font-weight: 700; color: var(--text-primary);">${lang === 'ta' ? 'திருமதி. மு. மீனாட்சி' : 'Thirumathi M. Meenakshi'}</span>
            </div>
          </div>

          <!-- Sangam Notice Banner -->
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d97706; padding: 10px 12px; border-radius: 8px; font-size: 12px; color: #92400e;">
            <strong>📢 ${lang === 'ta' ? 'சங்க அறிவிப்பு:' : 'Sangam Notice:'}</strong> ${lang === 'ta' ? 'மாதாந்திர ஆலோசனைக் கூட்டம் இன்று மாலை 4:30 மணிக்கு நடைபெறும்.' : 'Monthly council meeting scheduled today at 04:30 PM.'}
          </div>
        </div>

        <!-- Section 2: Latest Updates & News -->
        <div class="card card-floating-3d">
          <div class="card-header">
            <h3 class="card-title">
              ${icon('news', { size: 20, color: '#0b4f8a' })}
              <span>${lang === 'ta' ? 'சமீபத்திய அறிவிப்புகள்' : 'Official Updates'}</span>
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('news')">
              <span>${t('viewAll')}</span>
              ${icon('chevronRight', { size: 14, color: 'currentColor' })}
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${news.slice(0, 2).map(item => `
              <div style="padding: 12px; border-radius: 12px; border: 1px solid var(--border-subtle); background: #ffffff; cursor: pointer; transition: all 0.2s ease;" onclick="window.AAVIN_APP.navigate('news')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span class="badge" style="background: #e0f2fe; color: #0284c7;">
                    ${item.category === 'government_updates' ? (lang === 'ta' ? 'அரசு ஆணை' : 'Govt Order') : (lang === 'ta' ? 'ஆவின் செய்தி' : 'Aavin News')}
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);">${item.date}</span>
                </div>
                <div style="font-weight: 700; font-size: 13px; color: var(--text-primary); line-height: 1.35; margin-bottom: 4px;">
                  ${lang === 'ta' ? item.title_ta : item.title_en}
                </div>
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${lang === 'ta' ? item.content_ta : item.content_en}
                </p>
              </div>
            `).join('')}

            <!-- Upcoming Meeting Preview -->
            ${meetings.length > 0 ? `
              <div style="padding: 12px; border-radius: 12px; border: 1px solid #bae6fd; background: #f0f9ff; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                    ${icon('video', { size: 14, color: '#0369a1' })}
                    <span>${lang === 'ta' ? 'அடுத்த கூட்டம்' : 'Next Council Meeting'}</span>
                  </div>
                  <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                    ${meetings[0].scheduledTime}
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('meetings')">
                  ${lang === 'ta' ? 'இணைய' : 'Join'}
                </button>
              </div>
            ` : ''}
          </div>
        </div>

      </div>

      <!-- Section 3: Real-Time Issue Status Overview -->
      <div class="card card-floating-3d">
        <div class="card-header">
          <h3 class="card-title">
            ${icon('issues', { size: 20, color: '#dc2626' })}
            <span>${lang === 'ta' ? 'புகார் நிலை கண்காணிப்பு' : 'Issue Tracker Status'}</span>
          </h3>
          <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('issues', { action: 'track' })">
            <span>${lang === 'ta' ? 'அனைத்து புகார்கள்' : 'All Issues'}</span>
            ${icon('chevronRight', { size: 14, color: 'currentColor' })}
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 6px;">
          
          <div style="padding: 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #cbd5e1; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">${lang === 'ta' ? 'சமர்ப்பிக்கப்பட்டது' : 'Submitted'}</div>
            <div style="font-size: 22px; font-weight: 800; color: #475569; margin-top: 2px;">${submittedCount}</div>
            <span class="badge badge-status-submitted" style="margin-top: 4px;">New Entry</span>
          </div>

          <div style="padding: 12px; border-radius: 12px; background: #f0f9ff; border: 1px solid #bae6fd; text-align: center;">
            <div style="font-size: 11px; color: #0369a1; font-weight: 700;">${lang === 'ta' ? 'ஆய்வில் உள்ளது' : 'Under Review'}</div>
            <div style="font-size: 22px; font-weight: 800; color: #0284c7; margin-top: 2px;">${underReviewCount}</div>
            <span class="badge badge-status-verified" style="margin-top: 4px;">Admin Review</span>
          </div>

          <div style="padding: 12px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; text-align: center;">
            <div style="font-size: 11px; color: #92400e; font-weight: 700;">${lang === 'ta' ? 'நடவடிக்கையில்' : 'In Progress'}</div>
            <div style="font-size: 22px; font-weight: 800; color: #d97706; margin-top: 2px;">${inProgressCount}</div>
            <span class="badge badge-status-forwarded" style="margin-top: 4px;">Assigned</span>
          </div>

          <div style="padding: 12px; border-radius: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; text-align: center;">
            <div style="font-size: 11px; color: #166534; font-weight: 700;">${lang === 'ta' ? 'தீர்க்கப்பட்டது' : 'Resolved'}</div>
            <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 2px;">${resolvedCount}</div>
            <span class="badge badge-status-resolved" style="margin-top: 4px;">Completed</span>
          </div>

        </div>
      </div>
    `;
  }
};
