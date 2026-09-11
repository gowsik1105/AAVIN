/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial Role-Based Admin Portals: Tamil Nadu Admin, District Admin, and Sangam Admin
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.AdminPortals = {
  renderSangamAdmin() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'Thiru S. Palanivel (Sangam Secretary)',
      email: 'sangam.admin@aavin.tn.gov.in',
      role: 'sangam_admin',
      sangamName: 'Aavin Madurai Thozhilar Sangam',
      districtName: 'Madurai District'
    };
    const issues = (window.AAVIN_STORE.state.issues || []);
    const unverifiedIssues = issues.filter(i => !i.isAdminVerified);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div>
        <!-- Sangam Header Ribbon -->
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 18px; border-left: 6px solid #0b4f8a; background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #e8f2fc; color: #0b4f8a; font-weight: 800;">
                  🏢 SANGAM ADMIN PORTAL • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">✓ Verified Admin</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #07355e; font-weight: 800; margin-top: 6px;">
                ${admin.sangamName || 'Aavin Madurai Thozhilar Sangam'}
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('meetings')">
                ${icon('video', { size: 14, color: '#ffffff' })}
                <span>${lang === 'ta' ? 'கூட்டம் துவங்கு' : 'Host Meeting'}</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Admin Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- Sangam Operational KPIs -->
        <div class="grid-4" style="margin-bottom: 18px;">
          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Registered Members</div>
            <div style="font-size: 22px; font-weight: 800; color: var(--aavin-primary); margin-top: 2px;">1,420</div>
            <span class="badge badge-normal" style="margin-top: 4px;">✓ 100% Digital IDs</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Associated Facility</div>
            <div style="font-size: 14px; font-weight: 800; color: #15803d; margin-top: 2px;">Madurai Main Dairy</div>
            <span style="font-size: 10.5px; color: var(--text-muted);">Processing Plant • Verified</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Pending Verification</div>
            <div style="font-size: 22px; font-weight: 800; color: #ea580c; margin-top: 2px;">${unverifiedIssues.length}</div>
            <span class="badge badge-high" style="margin-top: 4px;">Needs Action</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Sangam Council</div>
            <div style="font-size: 14px; font-weight: 800; color: #0284c7; margin-top: 2px;">Active Term</div>
            <span class="badge badge-normal" style="margin-top: 4px;">2024 - 2029 Elected</span>
          </div>
        </div>

        <!-- Issues Requiring Sangam Admin Action -->
        <div class="card card-floating-3d" style="margin-bottom: 20px;">
          <div class="card-header">
            <h3 class="card-title">
              ${icon('issues', { size: 20, color: '#dc2626' })}
              <span>${lang === 'ta' ? 'சரிபார்ப்பு & நடவடிக்கை தேவைப்படும் புகார்கள்' : 'Local Sangam Grievances Queue'}</span>
            </h3>
            <span class="badge" style="background: #fef3c7; color: #92400e;">
              ${issues.length} Registered
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${issues.map(issue => `
              <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; border-left: 4px solid ${issue.finalPriority === 'critical' ? '#dc2626' : '#ea580c'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong style="color: #0b4f8a; font-family: monospace; font-size: 12px;">${issue.id}</strong>
                      <span class="badge ${issue.finalPriority === 'critical' ? 'badge-critical' : 'badge-high'}">
                        ${(issue.finalPriority || 'high').toUpperCase()}
                      </span>
                    </div>
                    <h4 style="font-size: 13.5px; margin-top: 4px; color: var(--text-primary); font-weight: 800;">${issue.title_en}</h4>
                    <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Reporter: ${issue.reporterName} • ${issue.createdAt}</p>
                  </div>

                  <div style="display: flex; gap: 6px;">
                    ${!issue.isAdminVerified ? `
                      <button class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.verifyIssue('${issue.id}', 'critical'); window.AAVIN_APP.showToast('Issue Verified & Prioritized');">
                        ✓ Verify & Escalate
                      </button>
                    ` : `
                      <span class="badge badge-status-verified">✓ Verified</span>
                    `}
                    <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('issues')">
                      View
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderDistrictAdmin() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'Er. M. Saravanan (District Milk Officer)',
      email: 'district.admin@aavin.tn.gov.in',
      role: 'district_admin',
      districtName: 'Madurai District'
    };
    const districtIssues = window.AAVIN_STORE.state.issues || [];

    return `
      <div>
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 18px; border-left: 6px solid #ea580c; background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #ffedd5; color: #ea580c; font-weight: 800;">
                  🏛️ DISTRICT HEADQUARTERS • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">✓ District Authority</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #7c2d12; font-weight: 800; margin-top: 6px;">
                Madurai District Cooperative Milk Producers Union
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('heatmap')">
                ${icon('trendingUp', { size: 14, color: '#ffffff' })}
                <span>Heatmap</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Admin Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- District KPI Grid -->
        <div class="grid-4" style="margin-bottom: 18px;">
          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Daily Milk Inflow</div>
            <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 2px;">3,24,000 LPD</div>
            <span class="badge badge-normal" style="margin-top: 4px;">+4.2% Growth</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Affiliated Sangams</div>
            <div style="font-size: 22px; font-weight: 800; color: var(--aavin-primary); margin-top: 2px;">48 Unions</div>
            <span class="badge badge-normal" style="margin-top: 4px;">100% Operational</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">District Grievances</div>
            <div style="font-size: 22px; font-weight: 800; color: #ea580c; margin-top: 2px;">${districtIssues.length}</div>
            <span class="badge badge-high" style="margin-top: 4px;">Avg 4.2h Resolution</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Main Processing Dairy</div>
            <div style="font-size: 14px; font-weight: 800; color: #0284c7; margin-top: 2px;">Madurai Complex</div>
            <span class="badge badge-normal" style="margin-top: 4px;">Capacity: 5 Lakh LPD</span>
          </div>
        </div>

        <!-- Issue Escalation Queue -->
        <div class="card card-floating-3d">
          <div class="card-header">
            <h3 class="card-title">
              ${icon('issues', { size: 20, color: '#dc2626' })}
              <span>District Issue Escalations & Department Routing</span>
            </h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${districtIssues.map(issue => `
              <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div>
                  <strong style="color: var(--aavin-primary); font-family: monospace;">${issue.id}</strong>
                  <span style="font-weight: 700; color: var(--text-primary); margin-left: 6px;">${issue.title_en}</span>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Location: ${issue.location} • Status: ${issue.status}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-primary btn-sm" onclick="window.AAVIN_STORE.forwardIssue('${issue.id}', 'dept_dairy_dev'); window.AAVIN_APP.showToast('Forwarded to State Dairy Dept');">
                    Forward to State Dept
                  </button>
                  <button class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.resolveIssue('${issue.id}', 'Technician dispatched and repair completed.'); window.AAVIN_APP.showToast('Issue Resolved');">
                    ✓ Resolve
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderStateAdmin() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'Thiru S. Rajendran, IAS (State Secretary)',
      email: 'tn.admin@aavin.tn.gov.in',
      role: 'tamil_nadu_admin',
      districtName: 'State Headquarters'
    };

    return `
      <div>
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 18px; border-left: 6px solid #7c3aed; background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #f3e8ff; color: #7c3aed; font-weight: 800;">
                  👑 TAMIL NADU ADMIN • STATE EXECUTIVE OVERVIEW
                </span>
                <span class="badge badge-normal">✓ State Secretariat Access</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #4c1d95; font-weight: 800; margin-top: 6px;">
                Tamil Nadu Dairy Development & Main Dairy Command
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
                ${icon('map', { size: 14, color: '#ffffff' })}
                <span>Main Dairy Explorer</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Admin Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- State Macro KPI Grid -->
        <div class="grid-4" style="margin-bottom: 18px;">
          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Total Daily Procurement</div>
            <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 2px;">38.4 Lakh LPD</div>
            <span class="badge badge-normal" style="margin-top: 4px;">38 Districts Active</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Verified Main Dairies</div>
            <div style="font-size: 22px; font-weight: 800; color: var(--aavin-primary); margin-top: 2px;">27 Facilities</div>
            <span class="badge badge-normal" style="margin-top: 4px;">1 District = 1 Main Dairy</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Govt Orders Enacted</div>
            <div style="font-size: 22px; font-weight: 800; color: #0284c7; margin-top: 2px;">14 GOs (2026)</div>
            <span class="badge badge-normal" style="margin-top: 4px;">Welfare & Subsidies</span>
          </div>

          <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Digital Member Reach</div>
            <div style="font-size: 22px; font-weight: 800; color: #7c3aed; margin-top: 2px;">4,20,000+</div>
            <span class="badge badge-normal" style="margin-top: 4px;">99.4% Smart Card Seeded</span>
          </div>
        </div>

        <!-- Main Dairies Management Table Preview -->
        <div class="card card-floating-3d">
          <div class="card-header">
            <h3 class="card-title">
              ${icon('dairy', { size: 20, color: '#7c3aed' })}
              <span>Statewide Main Dairy Plants & Processing Infrastructure</span>
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
              View All 27 Facilities →
            </button>
          </div>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 12px;">
            Strict State Enforcement: Only authorized Main Dairies and Processing Plants are managed under this view. BMCs and collection booths are excluded.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <strong style="color: var(--aavin-primary); font-size: 13px;">Madurai Main Dairy</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Sathamangalam • 5 Lakh LPD</div>
              <span class="badge badge-normal" style="margin-top: 4px;">Processing Unit</span>
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <strong style="color: var(--aavin-primary); font-size: 13px;">Coimbatore Main Dairy</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Pachapalayam • 4.5 Lakh LPD</div>
              <span class="badge badge-normal" style="margin-top: 4px;">Dairy Plant</span>
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <strong style="color: var(--aavin-primary); font-size: 13px;">Salem Main Dairy</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Sithanur • 4 Lakh LPD</div>
              <span class="badge badge-normal" style="margin-top: 4px;">Feeder Balancing</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
