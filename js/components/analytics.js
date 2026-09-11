/**
 * AAVIN SANGAM
 * District Problem Heatmap & Sangam Operational Analytics
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Analytics = {
  renderHeatmap() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);

    const districtHeatmapData = [
      {
        code: 'MDU',
        name_en: 'Madurai',
        name_ta: 'மதுரை',
        severity: 'critical',
        infrastructure: 12,
        equipment: 8,
        documentation: 5,
        veterinary: 3,
        total: 28,
        alertReason: 'Pasteurization line refrigeration maintenance alert at Madurai Main Dairy'
      },
      {
        code: 'CBE',
        name_en: 'Coimbatore',
        name_ta: 'கோயம்புத்தூர்',
        severity: 'medium',
        infrastructure: 4,
        equipment: 3,
        documentation: 2,
        veterinary: 7,
        total: 16,
        alertReason: 'Veterinary doctor coverage needed in Thondamuthur belt'
      },
      {
        code: 'SLM',
        name_en: 'Salem',
        name_ta: 'சேலம்',
        severity: 'high',
        infrastructure: 5,
        equipment: 8,
        documentation: 9,
        veterinary: 2,
        total: 24,
        alertReason: 'DBT bank IFSC transition inquiries for July batch'
      },
      {
        code: 'ERD',
        name_en: 'Erode',
        name_ta: 'ஈரோடு',
        severity: 'normal',
        infrastructure: 3,
        equipment: 4,
        documentation: 3,
        veterinary: 1,
        total: 11,
        alertReason: 'Normal operational parameters across all 165 Sangams'
      },
      {
        code: 'TRY',
        name_en: 'Tiruchirappalli',
        name_ta: 'திருச்சிராப்பள்ளி',
        severity: 'normal',
        infrastructure: 2,
        equipment: 3,
        documentation: 2,
        veterinary: 2,
        total: 9,
        alertReason: 'All BMC units functional; solar backup operational'
      },
      {
        code: 'TNV',
        name_en: 'Tirunelveli',
        name_ta: 'திருநெல்வேலி',
        severity: 'normal',
        infrastructure: 2,
        equipment: 2,
        documentation: 3,
        veterinary: 1,
        total: 8,
        alertReason: 'Procurement stable with seasonal flush'
      }
    ];

    return `
      <div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.5rem; color: var(--aavin-primary);">🔥 ${lang === 'ta' ? 'மாவட்ட வாரியான பிரச்சனைகள் அடர்த்தி வரைபடம்' : 'District Problem Concentration Heatmap'}</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            ${lang === 'ta'
        ? 'அங்கீகரிக்கப்பட்ட அரசு அதிகாரிகள் உடனடியாக உதவி தேவைப்படும் இடங்களை கண்டறியும் பிரத்யேக வரைபடம். தனிநபர் தகவல் எதுவும் வெளிப்படுத்தப்படாது.'
        : 'Aggregated problem concentration for government resource dispatch and infrastructure support. Personal member information is strictly anonymized.'}
          </p>
        </div>

        <!-- Heatmap Grid -->
        <div class="heatmap-grid">
          ${districtHeatmapData.map(d => `
            <div class="heatmap-cell severity-${d.severity}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="font-size: 15px; color: var(--aavin-primary); font-weight: 700;">
                  📍 ${lang === 'ta' ? d.name_ta : d.name_en}
                </h4>
                <span class="badge ${d.severity === 'critical' ? 'badge-critical' : (d.severity === 'high' ? 'badge-high' : 'badge-normal')}">
                  ${d.total} Issues
                </span>
              </div>

              <!-- Breakdown Bars -->
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; margin-top: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">🏢 Infrastructure:</span>
                  <strong>${d.infrastructure}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">❄️ Equipment & BMC:</span>
                  <strong style="color: ${d.equipment > 5 ? '#dc2626' : 'inherit'};">${d.equipment}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">📄 Documentation & DBT:</span>
                  <strong>${d.documentation}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">🐄 Veterinary Health:</span>
                  <strong>${d.veterinary}</strong>
                </div>
              </div>

              <div style="margin-top: 8px; font-size: 11px; color: #475569; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                ℹ️ ${d.alertReason}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderAnalytics() {
    const lang = window.I18N.currentLang;

    return `
      <div>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.5rem; color: var(--aavin-primary);">📈 ${lang === 'ta' ? 'அரசு புள்ளிவிவரங்கள் & சங்கங்களின் செயல்திறன்' : 'State & Sangam Operational Performance Overview'}</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Neutral operational monitoring to support dairy farmers and ensure uninterrupted procurement.
          </p>
        </div>

        <!-- Issue Categories Distribution Visualization -->
        <div class="card" style="margin-bottom: 20px;">
          <h3 class="card-title" style="margin-bottom: 14px;">📊 Grievance Category Breakdown (Statewide)</h3>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span>❄️ Bulk Milk Cooler / Chiller Power Fluctuation</span>
                <span style="color: #dc2626;">38% (High Priority)</span>
              </div>
              <div style="height: 10px; background: #fee2e2; border-radius: 5px; overflow: hidden;">
                <div style="width: 38%; height: 100%; background: #dc2626;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span>🧪 Milk Fat / SNF Ultrasonic Analyzer Calibration</span>
                <span style="color: #ea580c;">24%</span>
              </div>
              <div style="height: 10px; background: #ffedd5; border-radius: 5px; overflow: hidden;">
                <div style="width: 24%; height: 100%; background: #ea580c;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span>💰 Milk Payment & Government Subsidy Direct Benefit</span>
                <span style="color: #d97706;">20%</span>
              </div>
              <div style="height: 10px; background: #fef3c7; border-radius: 5px; overflow: hidden;">
                <div style="width: 20%; height: 100%; background: #d97706;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                <span>🐄 Cattle Health & FMD Vaccination Requests</span>
                <span style="color: #15803d;">18%</span>
              </div>
              <div style="height: 10px; background: #dcfce7; border-radius: 5px; overflow: hidden;">
                <div style="width: 18%; height: 100%; background: #15803d;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resolution Velocity Metrics -->
        <div class="grid-3">
          <div class="card" style="text-align: center;">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Avg Resolution Time</div>
            <div style="font-size: 28px; font-weight: 800; color: #0b4f8a; margin-top: 4px;">18.4 Hrs</div>
            <span style="font-size: 11px; color: #15803d; font-weight: 600;">⚡ Down from 48 Hrs</span>
          </div>

          <div class="card" style="text-align: center;">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Clustered Issues Merged</div>
            <div style="font-size: 28px; font-weight: 800; color: #ea580c; margin-top: 4px;">142 Groups</div>
            <span style="font-size: 11px; color: var(--text-muted);">Prevented duplicate work</span>
          </div>

          <div class="card" style="text-align: center;">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Overall Resolution Rate</div>
            <div style="font-size: 28px; font-weight: 800; color: #15803d; margin-top: 4px;">91.4%</div>
            <span style="font-size: 11px; color: #15803d; font-weight: 600;">✓ Excellent SLA</span>
          </div>
        </div>
      </div>
    `;
  }
};
