/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Commercial Step-by-Step Issue Reporting Wizard & Visual Resolution Timeline
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.IssueSystem = {
  currentTab: 'report', // 'report' | 'track'
  currentStep: 1, // 1 to 4
  selectedCategory: 'catChillingPlant',
  issueDescription: '',
  selectedUrgency: 'high',
  attachedPhotos: [],
  isRecordingVoice: false,

  setTab(tab) {
    this.currentTab = tab;
    window.AAVIN_APP.renderCurrentView();
  },

  goToStep(step) {
    this.currentStep = step;
    const container = document.getElementById('issueWizardStepContainer');
    if (container) {
      container.innerHTML = this.renderWizardStep();
      this.updateStepPills();
    }
  },

  updateStepPills() {
    document.querySelectorAll('.wizard-step-pill').forEach(pill => {
      const pillStep = parseInt(pill.dataset.step, 10);
      pill.classList.toggle('active', pillStep === this.currentStep);
      pill.classList.toggle('completed', pillStep < this.currentStep);
    });
  },

  selectCategory(cat) {
    this.selectedCategory = cat;
    this.goToStep(2);
  },

  toggleVoiceInput() {
    this.isRecordingVoice = !this.isRecordingVoice;
    const btn = document.getElementById('voiceInputBtn');
    const input = document.getElementById('issueDescInput');
    const lang = window.I18N.currentLang;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (this.isRecordingVoice) {
      if (btn) btn.innerHTML = `<span class="voice-wave-container"><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span></span> <span>Recording Tamil/English Audio...</span>`;
      window.AAVIN_APP.showToast('Listening... Speak your grievance');
      setTimeout(() => {
        if (input) {
          input.value = lang === 'ta'
            ? 'மதுரை முதன்மை பால் பண்ணை பதப்படுத்தும் பிரிவு 2-வது கம்ப்ரசர் லைன் காலை 6:30 மணியிலிருந்து மின்தடை காரணமாக பராமரிப்பு தேவைப்படுகிறது. தடையற்ற பால் விநியோகத்திற்கு உடனடியாக மாற்று உதிரிபாகம் வழங்கி உதவவும்.'
            : 'Madurai Main Dairy processing unit 2 chilling line compressor experienced voltage fluctuation at 6:30 AM. Routine maintenance and replacement coil requested to ensure uninterrupted milk processing.';
          this.issueDescription = input.value;
        }
        this.isRecordingVoice = false;
        if (btn) btn.innerHTML = `${icon('mic', { size: 16, color: '#dc2626' })} <span>${lang === 'ta' ? 'குரல் பதிவு (Tap to Speak)' : 'Tap to Speak'}</span>`;
        window.AAVIN_APP.showToast('Voice transcribed successfully');
      }, 2200);
    } else {
      if (btn) btn.innerHTML = `${icon('mic', { size: 16, color: '#dc2626' })} <span>${lang === 'ta' ? 'குரல் பதிவு (Tap to Speak)' : 'Tap to Speak'}</span>`;
    }
  },

  submitNewIssue() {
    const descInput = document.getElementById('issueDescInput');
    if (descInput) this.issueDescription = descInput.value;

    const newIssueId = 'MDU-ISSUE-' + Math.floor(1000 + Math.random() * 9000);
    const member = window.AAVIN_DATA.currentMember;
    const lang = window.I18N.currentLang;

    const newIssue = {
      id: newIssueId,
      reporterId: member.id,
      reporterName: lang === 'ta' ? member.name_ta : member.name_en,
      districtCode: member.districtCode,
      sangamId: member.sangamId,
      sangamName_en: member.sangamName_en,
      category: this.selectedCategory,
      categoryName_en: this.getCategoryName(this.selectedCategory, 'en'),
      categoryName_ta: this.getCategoryName(this.selectedCategory, 'ta'),
      title_en: `${this.getCategoryName(this.selectedCategory, 'en')} service request at ${member.dairyName_en || 'Madurai Main Dairy'}`,
      title_ta: `${this.getCategoryName(this.selectedCategory, 'ta')} கோரிக்கை`,
      description: this.issueDescription || 'Detailed inspection and maintenance requested.',
      location: `${member.dairyName_en || 'Aavin Madurai Main Dairy'}, Sathamangalam`,
      relatedReportsCount: 1,
      calculatedPriority: this.selectedUrgency,
      finalPriority: this.selectedUrgency,
      isAdminVerified: false,
      status: 'submitted',
      createdAt: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      history: [
        { status: 'submitted', date: 'Just now', actor: member.name_en, note: 'Issue submitted via Step Wizard.' }
      ]
    };

    window.AAVIN_STORE.addIssue(newIssue);
    this.currentStep = 1;
    this.issueDescription = '';
    this.currentTab = 'track';
    window.AAVIN_APP.showToast(`Issue ${newIssueId} Submitted Successfully!`);
    window.AAVIN_APP.renderCurrentView();
  },

  getCategoryName(catKey, lang) {
    const map = {
      catChillingPlant: { en: 'Processing & Chilling Plant Fault', ta: 'பதப்படுத்தும் அலகு & கம்ப்ரசர் பழுது' },
      catPaymentDelay: { en: 'Milk Payment & Settlement Delay', ta: 'பால் பட்டுவாடா நிலுவைத் தொகை' },
      catMilkFatTesting: { en: 'Fat/SNF Analyzer Discrepancy', ta: 'கொழுப்பு சத்து (FAT / SNF) அளவு முரண்பாடு' },
      catFeedSubsidy: { en: 'Cattle Feed & Subsidy Distribution', ta: 'கால்நடை தீவனம் & அரசு மானியம்' },
      catVeterinary: { en: 'Veterinary Emergency Support', ta: 'கால்நடை மருத்துவ அவசர உதவி' },
      catInfrastructure: { en: 'Dairy Storage & Cold Chain Transport', ta: 'பால் சேமிப்பு & குளிர்சாதன வாகனம்' },
      catGeneral: { en: 'General Sangam Welfare Grievance', ta: 'பொது சங்கம் & தொழிலாளர் கோரிக்கை' }
    };
    return map[catKey] ? map[catKey][lang] : catKey;
  },

  render(defaultTab = 'report') {
    if (defaultTab && defaultTab !== this.currentTab) {
      this.currentTab = defaultTab;
    }
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 720px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.35rem; color: #dc2626; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              ${icon('issues', { size: 22, color: '#dc2626' })}
              <span>${t('navIssues')}</span>
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${lang === 'ta' ? 'தொழிலாளர் கோரிக்கைகள் மற்றும் உடனடி தீர்வு கண்காணிப்பு' : 'Direct Member Grievance Filing & Multi-Tier Resolution Tracking'}
            </p>
          </div>
        </div>

        <!-- Segmented Tab Switcher -->
        <div class="segmented-control-bar">
          <button class="segmented-control-btn ${this.currentTab === 'report' ? 'active' : ''}" onclick="window.AAVIN_COMPONENTS.IssueSystem.setTab('report')">
            ${icon('plus', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'புதிய புகார் பதிவு' : 'Report Issue'}</span>
          </button>
          <button class="segmented-control-btn ${this.currentTab === 'track' ? 'active' : ''}" onclick="window.AAVIN_COMPONENTS.IssueSystem.setTab('track')">
            ${icon('clock', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'புகார் நிலை கண்காணிப்பு' : 'Track Status'}</span>
          </button>
        </div>

        <!-- Tab 1: 4-Step Issue Wizard -->
        ${this.currentTab === 'report' ? `
          <div class="card card-floating-3d">
            <!-- Stepper Header -->
            <div class="issue-stepper-bar">
              <div class="wizard-step-pill ${this.currentStep === 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}" data-step="1" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(1)">
                <div class="wizard-step-circle">1</div>
                <div class="wizard-step-label">${lang === 'ta' ? 'வகை' : 'Category'}</div>
              </div>
              <div class="wizard-step-pill ${this.currentStep === 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}" data-step="2" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(2)">
                <div class="wizard-step-circle">2</div>
                <div class="wizard-step-label">${lang === 'ta' ? 'விவரம்' : 'Details'}</div>
              </div>
              <div class="wizard-step-pill ${this.currentStep === 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}" data-step="3" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(3)">
                <div class="wizard-step-circle">3</div>
                <div class="wizard-step-label">${lang === 'ta' ? 'ஆதாரம்' : 'Media'}</div>
              </div>
              <div class="wizard-step-pill ${this.currentStep === 4 ? 'active' : ''}" data-step="4" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(4)">
                <div class="wizard-step-circle">4</div>
                <div class="wizard-step-label">${lang === 'ta' ? 'உறுதிசெய்க' : 'Submit'}</div>
              </div>
            </div>

            <!-- Dynamic Wizard Step Body -->
            <div id="issueWizardStepContainer">
              ${this.renderWizardStep()}
            </div>
          </div>
        ` : `
          <!-- Tab 2: Tracking List -->
          ${this.renderIssueTrackerList()}
        `}
      </div>
    `;
  },

  renderWizardStep() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const member = window.AAVIN_DATA.currentMember;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (this.currentStep === 1) {
      const categories = [
        { key: 'catChillingPlant', iconName: 'factory', color: '#0284c7' },
        { key: 'catPaymentDelay', iconName: 'trendingUp', color: '#15803d' },
        { key: 'catMilkFatTesting', iconName: 'shieldCheck', color: '#d97706' },
        { key: 'catFeedSubsidy', iconName: 'dairy', color: '#0b4f8a' },
        { key: 'catVeterinary', iconName: 'heart', color: '#dc2626' },
        { key: 'catInfrastructure', iconName: 'truck', color: '#7c3aed' },
        { key: 'catGeneral', iconName: 'fileText', color: '#475569' }
      ];

      return `
        <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 12px;">
          ${lang === 'ta' ? 'படி 1: புகார் வகையை தேர்ந்தெடுக்கவும்' : 'Step 1: Select Grievance Category'}
        </h4>
        <div class="category-selection-grid">
          ${categories.map(c => `
            <div class="category-select-card ${this.selectedCategory === c.key ? 'selected' : ''}" onclick="window.AAVIN_COMPONENTS.IssueSystem.selectCategory('${c.key}')">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: ${c.color};">
                ${icon(c.iconName, { size: 24, color: c.color })}
              </div>
              <strong style="font-size: 12px; color: var(--text-primary); text-align: center; line-height: 1.3;">
                ${this.getCategoryName(c.key, lang)}
              </strong>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.currentStep === 2) {
      return `
        <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 12px;">
          ${lang === 'ta' ? 'படி 2: பிரச்சினை விவரங்களை உள்ளிடவும்' : 'Step 2: Enter Issue Description'}
        </h4>

        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary);">
              ${lang === 'ta' ? 'பிரச்சினை விளக்கம்' : 'Issue Description'}
            </label>
            <button id="voiceInputBtn" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.IssueSystem.toggleVoiceInput()">
              ${icon('mic', { size: 14, color: '#dc2626' })}
              <span>${lang === 'ta' ? 'குரல் பதிவு' : 'Voice Input'}</span>
            </button>
          </div>
          <textarea 
            id="issueDescInput"
            rows="4" 
            placeholder="${lang === 'ta' ? 'பிரச்சினையின் விவரங்களை தெளிவாக உள்ளிடவும்...' : 'Describe the exact issue, location, or machinery fault...'}"
            style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--border-strong); font-size: 13.5px; font-family: inherit; resize: vertical; outline: none;"
          >${this.issueDescription}</textarea>
        </div>

        <!-- Priority Select -->
        <div style="margin-bottom: 16px;">
          <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
            ${lang === 'ta' ? 'அவசர நிலை' : 'Urgency Level'}
          </label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <label style="flex: 1; min-width: 100px; padding: 10px; border-radius: 10px; border: 1.5px solid ${this.selectedUrgency === 'critical' ? '#dc2626' : '#e2e8f0'}; background: ${this.selectedUrgency === 'critical' ? '#fee2e2' : '#ffffff'}; cursor: pointer; text-align: center; font-size: 12px; font-weight: 700;">
              <input type="radio" name="urgency" value="critical" ${this.selectedUrgency === 'critical' ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.IssueSystem.selectedUrgency='critical'" style="display:none;" />
              🚨 Critical
            </label>
            <label style="flex: 1; min-width: 100px; padding: 10px; border-radius: 10px; border: 1.5px solid ${this.selectedUrgency === 'high' ? '#ea580c' : '#e2e8f0'}; background: ${this.selectedUrgency === 'high' ? '#ffedd5' : '#ffffff'}; cursor: pointer; text-align: center; font-size: 12px; font-weight: 700;">
              <input type="radio" name="urgency" value="high" ${this.selectedUrgency === 'high' ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.IssueSystem.selectedUrgency='high'" style="display:none;" />
              ⚡ High
            </label>
            <label style="flex: 1; min-width: 100px; padding: 10px; border-radius: 10px; border: 1.5px solid ${this.selectedUrgency === 'normal' ? '#16a34a' : '#e2e8f0'}; background: ${this.selectedUrgency === 'normal' ? '#dcfce7' : '#ffffff'}; cursor: pointer; text-align: center; font-size: 12px; font-weight: 700;">
              <input type="radio" name="urgency" value="normal" ${this.selectedUrgency === 'normal' ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.IssueSystem.selectedUrgency='normal'" style="display:none;" />
              ✓ Normal
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(1)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button class="btn btn-primary" onclick="const d = document.getElementById('issueDescInput'); if(d) window.AAVIN_COMPONENTS.IssueSystem.issueDescription = d.value; window.AAVIN_COMPONENTS.IssueSystem.goToStep(3)">
            ${lang === 'ta' ? 'அடுத்தது' : 'Next: Media'} →
          </button>
        </div>
      `;
    }

    if (this.currentStep === 3) {
      return `
        <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 12px;">
          ${lang === 'ta' ? 'படி 3: புகைப்படங்கள் & ஆவணங்கள் இணைத்தல்' : 'Step 3: Attach Photos & Media'}
        </h4>

        <div style="border: 2px dashed #94a3b8; border-radius: 16px; padding: 24px; text-align: center; background: #f8fafc; margin-bottom: 16px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
            ${icon('camera', { size: 24, color: '#0284c7' })}
          </div>
          <strong style="font-size: 14px; color: var(--text-primary); display: block;">
            ${lang === 'ta' ? 'புகைப்படம் எடுக்க அல்லது பதிவேற்றவும்' : 'Take Photo or Upload Machine Reading'}
          </strong>
          <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
            Supports JPG, PNG, PDF up to 10MB
          </p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 10px;" onclick="window.AAVIN_APP.showToast('Photo uploaded from camera')">
            ${icon('camera', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'கேமரா திறக்க' : 'Open Camera'}</span>
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(2)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button class="btn btn-primary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(4)">
            ${lang === 'ta' ? 'மதிப்பாய்வு' : 'Next: Review'} →
          </button>
        </div>
      `;
    }

    if (this.currentStep === 4) {
      return `
        <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 12px;">
          ${lang === 'ta' ? 'படி 4: உறுதிசெய்து சமர்ப்பிக்கவும்' : 'Step 4: Confirm & Submit'}
        </h4>

        <div style="background: #f8fafc; border-radius: 12px; border: 1px solid var(--border-subtle); padding: 14px; margin-bottom: 16px; font-size: 13px;">
          <div style="margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 11px;">CATEGORY:</span>
            <div style="font-weight: 800; color: var(--aavin-primary);">${this.getCategoryName(this.selectedCategory, lang)}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 11px;">REPORTER & LOCATION:</span>
            <div style="font-weight: 700; color: var(--text-primary);">${lang === 'ta' ? member.name_ta : member.name_en} (${member.dairyName_en || 'Madurai Main Dairy'})</div>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: var(--text-muted); font-size: 11px;">URGENCY:</span>
            <div><span class="badge badge-${this.selectedUrgency}">${this.selectedUrgency.toUpperCase()}</span></div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 11px;">DESCRIPTION:</span>
            <p style="color: #334155; margin-top: 2px;">${this.issueDescription || 'Standard inspection and maintenance requested.'}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(3)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button class="btn btn-success" onclick="window.AAVIN_COMPONENTS.IssueSystem.submitNewIssue()">
            ${icon('check', { size: 16, color: '#ffffff' })}
            <span>${lang === 'ta' ? 'புகாரை சமர்ப்பிக்கவும்' : 'Confirm & Submit Grievance'}</span>
          </button>
        </div>
      `;
    }
  },

  renderIssueTrackerList() {
    const lang = window.I18N.currentLang;
    const t = (k) => window.I18N.t(k);
    const issues = window.AAVIN_STORE.state.issues || [];
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (issues.length === 0) {
      return `
        <div class="card card-floating-3d" style="text-align: center; padding: 32px;">
          <div style="font-size: 40px; margin-bottom: 8px;">📋</div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? 'புகார்கள் எதுவும் இல்லை' : 'No Grievances Found'}</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Submit a new issue to track real-time resolution status.</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${issues.map(issue => `
          <div class="card card-floating-3d" style="border-left: 4px solid ${issue.status === 'resolved' ? '#15803d' : '#0b4f8a'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
              <div>
                <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: var(--aavin-primary); background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">
                  ${issue.id}
                </span>
                <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                  ${lang === 'ta' ? (issue.title_ta || issue.title_en) : issue.title_en}
                </h4>
              </div>
              <span class="badge badge-status-${issue.status}">
                ${issue.status.toUpperCase()}
              </span>
            </div>

            <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
              ${issue.description}
            </p>

            <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 8px; margin-bottom: 12px;">
              <span>📍 ${issue.location}</span>
              <span>📅 ${issue.createdAt}</span>
            </div>

            <!-- Visual 7-Stage Resolution Timeline -->
            <div class="resolution-timeline">
              <div class="timeline-event-node completed">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? '1. புகார் சமர்ப்பிக்கப்பட்டது' : '1. Grievance Submitted'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${issue.createdAt} • ${issue.reporterName}</div>
              </div>

              <div class="timeline-event-node ${issue.status !== 'submitted' ? 'completed' : 'active'}">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? '2. சங்க நிர்வாகி சரிபார்ப்பு' : '2. Sangam Admin Verification'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${issue.status !== 'submitted' ? 'Verified by Sangam Secretary' : 'Awaiting Sangam verification'}</div>
              </div>

              <div class="timeline-event-node ${issue.status === 'forwarded' || issue.status === 'action_in_progress' || issue.status === 'resolved' ? 'completed' : ''}">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? '3. மாவட்ட அதிகாரிகளுக்கு பரிந்துரை' : '3. District HQ Escalation & Action'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${issue.status === 'resolved' ? 'Action Completed' : 'Under Technical Review'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
};
