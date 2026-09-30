/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial Meeting Center & Virtual Sangam Council Room
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Meetings = {
  currentTab: 'upcoming', // 'upcoming' | 'live' | 'completed'
  isMicOn: false,
  isCamOn: true,
  isHandRaised: false,
  activeSideTab: 'chat',

  switchTab(tab) {
    this.currentTab = tab;
    const container = document.getElementById('meetingTabContent');
    if (container) {
      container.innerHTML = this.renderTabContent();
    }
    document.querySelectorAll('.meeting-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  },

  renderTabContent() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const meetings = window.AAVIN_DATA.meetings || [];
    const pastRecordings = window.AAVIN_DATA.pastRecordings || [];
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (this.currentTab === 'upcoming') {
      if (meetings.length === 0) {
        return `
          <div class="card card-floating-3d hover-lift" style="text-align: center; padding: 36px 20px; border: 1.5px dashed var(--border-strong); background: #fafcff;">
            <div style="width: 56px; height: 56px; border-radius: 16px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              ${icon('video', { size: 28, color: '#0284c7' })}
            </div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
              ${lang === 'ta' ? 'வரவிருக்கும் கூட்டங்கள் எதுவும் திட்டமிடப்படவில்லை' : 'No Upcoming Meetings Scheduled'}
            </h3>
            <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; max-width: 380px; margin: 0 auto;">
              ${lang === 'ta' ? 'அடுத்த ஆவின் சங்க ஆலோசனைக் கூட்டம் திட்டமிடப்பட்டதும் இங்கு அறிவிக்கப்படும்.' : 'New council assemblies and virtual meetings will appear here when scheduled.'}
            </p>
          </div>
        `;
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${meetings.map(m => `
            <div class="card card-floating-3d hover-lift" style="border-left: 5px solid var(--aavin-primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 800;">
                      ${icon('clock', { size: 12, color: '#0284c7' })} ${m.scheduledTime}
                    </span>
                    <span class="badge badge-normal">
                      ${icon('user', { size: 12, color: '#15803d' })} ${m.attendeesCount} ${lang === 'ta' ? 'உறுப்பினர்கள்' : 'Registered'}
                    </span>
                  </div>
                  <h3 style="font-size: 15.5px; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
                    ${lang === 'ta' ? m.title_ta : m.title_en}
                  </h3>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    <strong>${lang === 'ta' ? 'ஒருங்கிணைப்பாளர்:' : 'Organizer:'}</strong> ${m.organizer}
                  </div>
                </div>
                <div>
                  <button class="btn btn-primary" onclick="window.AAVIN_COMPONENTS.Meetings.switchTab('live')">
                    ${icon('video', { size: 16, color: '#ffffff' })}
                    <span>${lang === 'ta' ? 'கூட்டத்தில் இணைய' : 'Join Live Meeting'}</span>
                    ${icon('arrowRight', { size: 14, color: '#ffffff' })}
                  </button>
                </div>
              </div>

              <!-- Agenda List -->
              <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px; margin-top: 10px;">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  ${icon('fileText', { size: 14, color: 'currentColor' })}
                  <span>${lang === 'ta' ? 'கூட்ட நிகழ்ச்சி நிரல் (Agenda):' : 'Meeting Agenda:'}</span>
                </div>
                <ul style="padding-left: 18px; font-size: 12.5px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
                  ${m.agenda.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.currentTab === 'live') {
      return `
        <!-- Live Meeting Interactive Room Container -->
        <div class="meeting-player-frame" style="padding: 16px; margin-bottom: 20px;">
          <!-- Live Room Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="meeting-live-pill">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
                LIVE
              </span>
              <strong style="font-size: 14.5px; color: white;">Aavin Madurai Thozhilar Sangam Council & Review</strong>
            </div>
            <span style="font-size: 12px; color: #94a3b8;">52 Active Attendees</span>
          </div>

          <!-- Virtual Video Simulation & Panel Layout -->
          <div class="grid-2" style="gap: 14px;">
            <!-- Speaker Main Video Box -->
            <div class="meeting-video-screen" style="border: 2px solid #0284c7; border-radius: 12px;">
              <div style="width: 68px; height: 68px; border-radius: 50%; background: #0b4f8a; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 3px solid #38bdf8;">
                ${icon('user', { size: 36, color: '#ffffff' })}
              </div>
              <div style="margin-top: 8px; font-size: 13.5px; font-weight: 800; color: white;">
                Thiru S. Palanivel (Secretary)
              </div>
              <div style="font-size: 11.5px; color: #93c5fd;">
                Speaking: Processing line optimization & bonus scheme
              </div>
            </div>

            <!-- Live Chat & Resolutions Panel -->
            <div style="background: #1e293b; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; min-height: 240px;">
              <div style="font-size: 12.5px; font-weight: 800; color: #93c5fd; border-bottom: 1px solid #334155; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                ${icon('meetings', { size: 14, color: '#93c5fd' })}
                <span>Live Meeting Chat & Q&A</span>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; margin: 10px 0; overflow-y: auto; max-height: 140px;">
                <div style="background: rgba(255,255,255,0.06); padding: 8px; border-radius: 8px;">
                  <strong style="color: #38bdf8;">M. Meenakshi:</strong> Milk chilling plant spare motor dispatched today.
                </div>
                <div style="background: rgba(255,255,255,0.06); padding: 8px; border-radius: 8px;">
                  <strong style="color: #4ade80;">K. Muthupandi:</strong> District Union will inspect Madurai Main Dairy on Friday.
                </div>
              </div>

              <div style="display: flex; gap: 6px;">
                <input type="text" placeholder="Type query for Sangam Council..." style="flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 12px;" />
                <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.showToast('Question submitted to Sangam Council')">Send</button>
              </div>
            </div>
          </div>

          <!-- Controls Bar -->
          <div class="meeting-ctrl-bar" style="margin-top: 14px; border-radius: 10px;">
            <button class="meeting-ctrl-btn" onclick="window.AAVIN_APP.showToast('Microphone toggled')">
              ${icon('mic', { size: 18, color: '#ffffff' })}
            </button>
            <button class="meeting-ctrl-btn" onclick="window.AAVIN_APP.showToast('Camera toggled')">
              ${icon('video', { size: 18, color: '#ffffff' })}
            </button>
            <button class="meeting-ctrl-btn active-red" onclick="window.AAVIN_COMPONENTS.Meetings.switchTab('upcoming')">
              ${icon('close', { size: 18, color: '#ffffff' })}
            </button>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'completed') {
      if (pastRecordings.length === 0) {
        return `
          <div class="card card-floating-3d hover-lift" style="text-align: center; padding: 36px 20px; border: 1.5px dashed var(--border-strong); background: #fafcff;">
            <div style="width: 56px; height: 56px; border-radius: 16px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              ${icon('fileText', { size: 28, color: '#0284c7' })}
            </div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
              ${lang === 'ta' ? 'பதிவு செய்யப்பட்ட கூட்டங்கள் எதுவும் இல்லை' : 'No Past Proceedings Found'}
            </h3>
            <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; max-width: 380px; margin: 0 auto;">
              ${lang === 'ta' ? 'முடிவடைந்த கூட்டங்களின் தீர்மான அறிக்கைகள் மற்றும் ஆவணங்கள் இங்கு சேமிக்கப்படும்.' : 'Recorded minutes and resolution summaries will be archived here.'}
            </p>
          </div>
        `;
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${pastRecordings.map(rec => `
            <div class="card card-floating-3d hover-lift">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge" style="background: #f1f5f9; color: #475569;">
                      ${icon('clock', { size: 11, color: 'currentColor' })} ${rec.date}
                    </span>
                    <span class="badge" style="background: #e0f2fe; color: #0284c7;">
                      ${icon('video', { size: 11, color: 'currentColor' })} ${rec.duration}
                    </span>
                  </div>
                  <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                    ${lang === 'ta' ? rec.title_ta : rec.title_en}
                  </h4>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    ${rec.summary}
                  </div>
                </div>
                <div>
                  <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.showToast('Downloading verified Meeting Minutes PDF')">
                    ${icon('download', { size: 14, color: 'currentColor' })}
                    <span>${lang === 'ta' ? 'தீர்மான அறிக்கை' : 'Download Minutes'}</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  render(initialTab = 'upcoming') {
    this.currentTab = initialTab;
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.35rem; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
              ${icon('meetings', { size: 22, color: '#0b4f8a' })}
              <span>${t('navMeetings')}</span>
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${lang === 'ta' ? 'ஆவின் சங்க ஆலோசனைக் கூட்டங்கள் & நேரலை முடிவுகள்' : 'Live Virtual Sangam Council & Archived Assembly Proceedings'}
            </p>
          </div>
        </div>

        <!-- Segmented Tab Bar -->
        <div class="segmented-control-bar">
          <button class="segmented-control-btn meeting-tab-btn ${this.currentTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming" onclick="window.AAVIN_COMPONENTS.Meetings.switchTab('upcoming')">
            ${icon('clock', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'வரவிருக்கும் கூட்டங்கள்' : 'Upcoming'}</span>
          </button>
          <button class="segmented-control-btn meeting-tab-btn ${this.currentTab === 'live' ? 'active' : ''}" data-tab="live" onclick="window.AAVIN_COMPONENTS.Meetings.switchTab('live')">
            ${icon('video', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'நேரலை அரங்கம்' : 'Live Room'}</span>
          </button>
          <button class="segmented-control-btn meeting-tab-btn ${this.currentTab === 'completed' ? 'active' : ''}" data-tab="completed" onclick="window.AAVIN_COMPONENTS.Meetings.switchTab('completed')">
            ${icon('fileText', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'கடந்த கூட்டங்கள் & தீர்வு' : 'Past Minutes'}</span>
          </button>
        </div>

        <div id="meetingTabContent">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
  }
};
