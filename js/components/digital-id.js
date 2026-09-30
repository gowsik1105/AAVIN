/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Interactive 3D Digital ID Card with Holographic Spec & QR Verification
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.DigitalId = {
  isFlipped: false,

  toggleFlip() {
    const card = document.getElementById('interactiveDigitalIdCard');
    if (card) {
      this.isFlipped = !this.isFlipped;
      if (this.isFlipped) {
        card.classList.add('flipped');
      } else {
        card.classList.remove('flipped');
      }
    }
  },

  render() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const member = window.AAVIN_DATA.currentMember || (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.memberProfile) || null;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (!member) {
      return `
        <div style="min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
          <div style="width: 60px; height: 60px; border-radius: 18px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px;">
            🪪
          </div>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #07355e; margin-bottom: 8px;">
            ${lang === 'ta' ? 'டிஜிட்டல் அட்டைக்கு உள்நுழைக' : 'Digital ID Requires Authentication'}
          </h3>
          <p style="font-size: 12.5px; color: var(--text-secondary); max-width: 340px; margin-bottom: 18px;">
            ${lang === 'ta' ? 'உங்கள் ஸ்மார்ட் உறுப்பினர் அட்டையைப் பார்க்க உள்நுழையவும்.' : 'Please log in to view and download your verified Aavin Smart Digital ID card.'}
          </p>
          <button type="button" class="btn btn-primary" onclick="window.AAVIN_COMPONENTS.Auth.currentFlow='login'; window.AAVIN_COMPONENTS.Auth.render();">
            ${lang === 'ta' ? 'உள்நுழைவுப் பக்கம்' : 'Go to Login'} →
          </button>
        </div>
      `;
    }

    return `
      <div style="max-width: 540px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.35rem; color: var(--aavin-primary); font-weight: 800; display: flex; align-items: center; gap: 8px;">
              ${icon('digitalId', { size: 22, color: '#0b4f8a' })}
              <span>${t('navDigitalId')}</span>
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட டிஜிட்டல் உறுப்பினர் அடையாள அட்டை' : 'Verified Digital Membership Identity Card'}
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              ${icon('printer', { size: 14, color: 'currentColor' })}
              <span>${lang === 'ta' ? 'அச்சிடு' : 'Print'}</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.showToast('Digital ID saved as secure image')">
              ${icon('download', { size: 14, color: '#ffffff' })}
              <span>${lang === 'ta' ? 'பதிவிறக்கு' : 'Save'}</span>
            </button>
          </div>
        </div>

        <!-- 3D Card Interactive Shell -->
        <div class="digital-id-3d-wrapper">
          <div class="digital-id-3d-card" id="interactiveDigitalIdCard" onclick="window.AAVIN_COMPONENTS.DigitalId.toggleFlip()" title="Click to Flip Card">
            
            <!-- FRONT FACE -->
            <div class="id-card-face id-card-front">
              <!-- Top Ribbon & Gov Seal -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #b9d7f5; padding-bottom: 8px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; height: 28px; border-radius: 6px; background: #0b4f8a; color: white; display: flex; align-items: center; justify-content: center;">
                    ${icon('gov', { size: 18, color: '#ffffff' })}
                  </div>
                  <div>
                    <div style="font-size: 11px; font-weight: 800; color: #07355e; letter-spacing: 0.3px;">
                      GOVERNMENT OF TAMIL NADU
                    </div>
                    <div style="font-size: 9.5px; color: var(--aavin-primary); font-weight: 700;">
                      தமிழ்நாடு அரசு • பால்வளத்துறை
                    </div>
                  </div>
                </div>
                <div class="sim-chip-gold" title="Smart Chip"></div>
              </div>

              <!-- Main ID Body -->
              <div style="display: flex; gap: 14px; align-items: flex-start;">
                <!-- Member Photo Box -->
                <div style="width: 80px; height: 96px; border-radius: 10px; overflow: hidden; border: 2px solid var(--aavin-primary); background: #cbd5e1; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.12); position: relative;">
                  <img src="${member.avatarUrl}" alt="Member Photo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'" />
                  <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(21, 128, 61, 0.95); color: white; font-size: 8px; font-weight: 800; text-align: center; padding: 2px 0;">
                    ✓ VERIFIED
                  </div>
                </div>

                <!-- Member Credentials -->
                <div style="flex: 1; min-width: 0; font-size: 11.5px;">
                  <div style="font-size: 15px; font-weight: 800; color: #07355e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${lang === 'ta' ? member.name_ta : member.name_en}
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 6px; margin: 3px 0;">
                    <span style="color: var(--text-muted); font-size: 10.5px;">ID:</span>
                    <strong style="font-family: monospace; font-size: 12px; color: var(--aavin-primary); background: #e0f2fe; padding: 1px 6px; border-radius: 4px;">
                      ${member.memberId}
                    </strong>
                  </div>

                  <div style="margin-top: 4px; color: #334155; line-height: 1.35;">
                    <div><strong>${lang === 'ta' ? 'சங்கம்:' : 'Sangam:'}</strong> ${lang === 'ta' ? member.sangamName_ta : member.sangamName_en}</div>
                    <div><strong>${lang === 'ta' ? 'மாவட்டம்:' : 'District:'}</strong> ${lang === 'ta' ? member.districtName_ta : member.districtName_en}</div>
                    <div><strong>${lang === 'ta' ? 'பண்ணை:' : 'Main Dairy:'}</strong> ${member.dairyName_en || 'Aavin Madurai Main Dairy'}</div>
                  </div>
                </div>
              </div>

              <!-- Bottom Bar with QR preview & Flip hint -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #bfdbfe; padding-top: 8px; margin-top: 6px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted);">
                  ${icon('shieldCheck', { size: 14, color: '#15803d' })}
                  <span>Valid Thru: <strong>12/2028</strong></span>
                </div>
                <span style="font-size: 10.5px; font-weight: 700; color: var(--aavin-accent); display: flex; align-items: center; gap: 4px;">
                  ${icon('refresh', { size: 12, color: 'currentColor' })}
                  ${lang === 'ta' ? 'அட்டையை திருப்ப தட்டவும்' : 'Tap to Flip'} ↻
                </span>
              </div>
            </div>

            <!-- BACK FACE -->
            <div class="id-card-face id-card-back">
              <!-- Magnetic Strip -->
              <div style="background: #0f172a; height: 36px; margin: -18px -18px 12px -18px; border-bottom: 2px solid rgba(255,255,255,0.2);"></div>

              <div style="display: flex; gap: 14px; align-items: center; justify-content: space-between;">
                <!-- QR Code Box -->
                <div style="background: #ffffff; padding: 6px; border-radius: 8px; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); flex-shrink: 0;" onclick="event.stopPropagation(); window.AAVIN_APP.showQrVerificationModal()">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AAVIN-TN-${member.memberId}-VERIFIED-2026" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>

                <div style="flex: 1; font-size: 10.5px; line-height: 1.35; color: #e2e8f0;">
                  <div style="font-weight: 700; color: #fef08a; margin-bottom: 3px;">
                    ${lang === 'ta' ? 'பாதுகாப்பு சான்றிதழ்' : 'TAMIL NADU SECURITY SIGNATURE'}
                  </div>
                  <div>UID: SHA256-8F92A-AAVIN</div>
                  <div>Issued: Co-operative Societies Dept</div>
                  <div style="margin-top: 4px; font-size: 9.5px; opacity: 0.85;">
                    ${lang === 'ta' ? 'இந்த அட்டை ஆவின் சங்க உறுப்பினருக்கு மட்டுமே உரியது.' : 'Official Government Dairy Identity Card.'}
                  </div>
                </div>
              </div>

              <!-- Back Footer -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; font-size: 10px;">
                <span>Helpline: 1800-425-4422</span>
                <span style="color: #93c5fd;">Tap to Flip ↻</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Verification Action Panel -->
        <div class="card card-floating-3d" style="margin-top: 18px; padding: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: #dcfce7; display: flex; align-items: center; justify-content: center; color: #15803d;">
                ${icon('shieldCheck', { size: 22, color: '#15803d' })}
              </div>
              <div>
                <strong style="font-size: 13.5px; color: var(--text-primary);">${lang === 'ta' ? 'உறுப்பினர் அங்கீகாரம்' : 'Official Verification'}</strong>
                <div style="font-size: 11.5px; color: var(--text-muted);">${lang === 'ta' ? 'QR குறியீட்டை ஸ்கேன் செய்து சரிபார்க்கலாம்' : 'Scan live QR to verify authenticity with Dept Database'}</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.showQrVerificationModal()">
              ${icon('qr', { size: 14, color: 'currentColor' })}
              <span>${lang === 'ta' ? 'QR சரிபார்க்க' : 'Verify QR'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
