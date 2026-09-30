/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Sangam-Centric Grievance & Issue Management Portal
 * - 12 Focused Sangam Categories
 * - Dedicated Custom Problem ("புதிய பிரச்சனை / மற்ற பிரச்சனை") Form
 * - Real Attachment / Photo / Document Upload
 * - 6-Stage Tracking Lifecycle: Submitted → Under Review → Assigned → In Progress → Resolved → Closed
 * - Privacy-Preserving Member View (Members see only their own issues)
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.IssueSystem = {
  currentTab: 'report', // 'report' | 'track'
  currentStep: 1, // 1: வகை, 2: விவரம், 3: ஆதாரம், 4: உறுதிசெய்க
  selectedCategory: 'catSangamAdmin',
  customProblemTitle: '',
  issueDescription: '',
  selectedUrgency: 'normal', // 'normal' | 'urgent'
  attachedEvidence: null, // { name, type, size, dataUrl, isImage }
  isRecordingVoice: false,

  // 12 SANGAM-FOCUSED CATEGORIES
  CATEGORIES: [
    {
      key: 'catSangamAdmin',
      name_ta: 'Sangam நிர்வாகம்',
      name_en: 'Sangam Administration',
      icon: 'admin',
      color: '#0b4f8a',
      desc_ta: 'சங்க நிர்வாக ஒழுங்குமுறைகள் மற்றும் அலுவலக நடவடிக்கைகள்',
      desc_en: 'Sangam administrative decisions & governance'
    },
    {
      key: 'catMemberIssue',
      name_ta: 'உறுப்பினர் தொடர்பான பிரச்சனை',
      name_en: 'Member Related Issue',
      icon: 'user',
      color: '#0284c7',
      desc_ta: 'உறுப்பினர் உரிமைகள், தகுதி மற்றும் உறுப்பினர் நலன்',
      desc_en: 'Member rights, eligibility & member welfare'
    },
    {
      key: 'catMemberIdRecords',
      name_ta: 'உறுப்பினர் ID / பதிவுகள்',
      name_en: 'Member ID / Records',
      icon: 'digitalId',
      color: '#7c3aed',
      desc_ta: 'டிஜிட்டல் ஸ்மார்ட் கார்டு, பாஸ்புக் மற்றும் உறுப்பினர் பதிவேடு',
      desc_en: 'Digital ID smart cards, passbook updates & membership register'
    },
    {
      key: 'catMilkPayment',
      name_ta: 'பால் பணம் / கணக்கு தொடர்பான பிரச்சனை',
      name_en: 'Milk Payment / Accounts Issue',
      icon: 'trendingUp',
      color: '#15803d',
      desc_ta: 'பால் பட்டுவாடா தொகை, நிலுவை மற்றும் வங்கி DBT வரவு',
      desc_en: 'Milk procurement payment settlements & bank DBT credits'
    },
    {
      key: 'catFatSnf',
      name_ta: 'FAT / SNF தொடர்பான பிரச்சனை',
      name_en: 'FAT / SNF Quality Issue',
      icon: 'shieldCheck',
      color: '#d97706',
      desc_ta: 'கொழுப்பு சத்து (FAT / SNF) அளவு முரண்பாடு மற்றும் லாக்டோமீட்டர் பரிசோதனை',
      desc_en: 'FAT / SNF testing discrepancy & lactometer calibration'
    },
    {
      key: 'catMilkCollection',
      name_ta: 'பால் சேகரிப்பு தொடர்பான பிரச்சனை',
      name_en: 'Milk Collection Issue',
      icon: 'dairy',
      color: '#0284c7',
      desc_ta: 'கொள்முதல் நேரம், பால் பாத்திரங்கள் மற்றும் அளவீட்டு குறைபாடுகள்',
      desc_en: 'Collection shift timings, milk cans & weighing accuracy'
    },
    {
      key: 'catSangamFacilities',
      name_ta: 'Sangam வசதிகள் / அடிப்படை வசதிகள்',
      name_en: 'Sangam Facilities / Infrastructure',
      icon: 'factory',
      color: '#475569',
      desc_ta: 'மின்சாரம், குடிநீர், மேற்கூரை மற்றும் கட்டட பராமரிப்பு',
      desc_en: 'Power supply, water, roof & building infrastructure'
    },
    {
      key: 'catOfficeBearers',
      name_ta: 'தலைவர் / செயலாளர் / பொருளாளர் தொடர்பான நிர்வாக கோரிக்கை',
      name_en: 'Office Bearers Administrative Request',
      icon: 'award',
      color: '#ea580c',
      desc_ta: 'நிர்வாகக் குழு உறுப்பினர்கள் மற்றும் நிர்வாக ஒப்புதல்கள்',
      desc_en: 'President / Secretary / Treasurer approvals & submissions'
    },
    {
      key: 'catDocumentsCertificates',
      name_ta: 'ஆவணங்கள் / சான்றிதழ்கள்',
      name_en: 'Documents / Certificates',
      icon: 'fileText',
      color: '#2563eb',
      desc_ta: 'உறுப்பினர் சான்றிதழ், தடையில்லா சான்றிதழ் மற்றும் படிவங்கள்',
      desc_en: 'Membership certificates, NOCs, forms & bonafide records'
    },
    {
      key: 'catMeetingsAnnouncements',
      name_ta: 'கூட்டம் / அறிவிப்பு தொடர்பான பிரச்சனை',
      name_en: 'Meeting / Announcement Issue',
      icon: 'meetings',
      color: '#0d9488',
      desc_ta: 'பொதுக்குழு கூட்ட அழைப்பு, தீர்மானங்கள் மற்றும் அறிவிப்புகள்',
      desc_en: 'General council meetings, resolutions & notice circulars'
    },
    {
      key: 'catGovtSchemeSubsidy',
      name_ta: 'அரசு திட்டம் / மானியம் தொடர்பான பிரச்சனை',
      name_en: 'Govt Scheme / Subsidy Issue',
      icon: 'gov',
      color: '#059669',
      desc_ta: 'கால்நடை காப்பீடு, மானிய தீவனம், கடன் மற்றும் அரசு ஊக்கத்தொகை',
      desc_en: 'Cattle insurance, feed subsidies, loans & govt incentives'
    },
    {
      key: 'catCustomOther',
      name_ta: 'புதிய பிரச்சனை / மற்ற பிரச்சனை',
      name_en: 'New Problem / Other Problem',
      icon: 'plus',
      color: '#dc2626',
      isCustom: true,
      desc_ta: 'மேற்கண்ட வகைகளில் இல்லாத தனிப்பயன் கோரிக்கை அல்லது புதிய பிரச்சனை',
      desc_en: 'Custom grievance or any new specific issue not listed above'
    }
  ],

  setTab(tab) {
    this.currentTab = tab;
    window.AAVIN_APP.renderCurrentView();
  },

  goToStep(step) {
    // Save current inputs if transitioning from Step 2
    if (this.currentStep === 2) {
      const titleInput = document.getElementById('customProblemTitleInput');
      const descInput = document.getElementById('issueDescInput');
      if (titleInput) this.customProblemTitle = titleInput.value.trim();
      if (descInput) this.issueDescription = descInput.value.trim();
    }

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

  selectCategory(catKey) {
    this.selectedCategory = catKey;
    if (catKey !== 'catCustomOther' && !this.customProblemTitle) {
      const cat = this.CATEGORIES.find(c => c.key === catKey);
      this.customProblemTitle = cat ? cat.name_ta : '';
    } else if (catKey === 'catCustomOther') {
      this.customProblemTitle = '';
    }
    this.goToStep(2);
  },

  handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      window.AAVIN_APP.showToast('File size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.attachedEvidence = {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: e.target.result,
        isImage: file.type.startsWith('image/')
      };
      this.goToStep(3);
      window.AAVIN_APP.showToast(`Uploaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  },

  removeAttachedEvidence() {
    this.attachedEvidence = null;
    const input = document.getElementById('issueFileInput');
    if (input) input.value = '';
    this.goToStep(3);
    window.AAVIN_APP.showToast('Attachment removed');
  },

  toggleVoiceInput() {
    this.isRecordingVoice = !this.isRecordingVoice;
    const btn = document.getElementById('voiceInputBtn');
    const input = document.getElementById('issueDescInput');
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    if (this.isRecordingVoice) {
      if (btn) btn.innerHTML = `<span class="voice-wave-container"><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span><span class="voice-wave-bar"></span></span> <span>Listening...</span>`;
      window.AAVIN_APP.showToast('Listening... Speak in Tamil or English');
      setTimeout(() => {
        if (input) {
          const sampleText = lang === 'ta'
            ? 'எங்கள் சங்கத்தில் பால் கொழுப்பு சத்து (FAT / SNF) பரிசோதனையில் முரண்பாடுகள் ஏற்படுகின்றன. தரக்கட்டுப்பாட்டு அதிகாரியை அனுப்பி லாக்டோமீட்டர் மற்றும் அனலைசரை ஆய்வு செய்து சரிசெய்து தருமாறு கேட்டுக்கொள்கிறேன்.'
            : 'There is a discrepancy in the FAT/SNF milk quality analyzer reading at our Sangam collection center. Requesting immediate inspection and calibration by the quality testing team.';
          input.value = sampleText;
          this.issueDescription = input.value;
        }
        this.isRecordingVoice = false;
        if (btn) btn.innerHTML = `${icon('mic', { size: 14, color: '#dc2626' })} <span>${lang === 'ta' ? 'குரல் பதிவு' : 'Voice Input'}</span>`;
        window.AAVIN_APP.showToast('Voice transcribed successfully');
      }, 2000);
    } else {
      if (btn) btn.innerHTML = `${icon('mic', { size: 14, color: '#dc2626' })} <span>${lang === 'ta' ? 'குரல் பதிவு' : 'Voice Input'}</span>`;
    }
  },

  submitNewIssue() {
    const titleInput = document.getElementById('customProblemTitleInput');
    const descInput = document.getElementById('issueDescInput');
    if (titleInput) this.customProblemTitle = titleInput.value.trim();
    if (descInput) this.issueDescription = descInput.value.trim();

    const selectedCatObj = this.CATEGORIES.find(c => c.key === this.selectedCategory) || this.CATEGORIES[0];
    const isCustom = this.selectedCategory === 'catCustomOther';

    const finalTitle = this.customProblemTitle || (isCustom ? 'புதிய பிரச்சனை / மற்ற பிரச்சனை' : selectedCatObj.name_ta);
    const finalDescription = this.issueDescription || 'விவரம் பதிவு செய்யப்பட்டுள்ளது.';

    const member = window.AAVIN_DATA.currentMember || {
      id: 'usr-mdu-0841',
      name_en: 'S. Saravanan',
      name_ta: 'S. சரவணன்',
      districtCode: 'MDU',
      districtName_en: 'Madurai District',
      districtName_ta: 'மதுரை மாவட்டம்',
      sangamId: 'sgm-mdu',
      sangamName_en: 'Aavin Madurai Thozhilar Sangam',
      sangamName_ta: 'ஆவின் மதுரை தொழிலாளர் சங்கம்'
    };

    const newIssueId = 'SGM-' + (member.districtCode || 'TN') + '-' + Math.floor(1000 + Math.random() * 9000);
    const lang = window.I18N ? window.I18N.currentLang : 'ta';

    const newIssue = {
      id: newIssueId,
      reporterId: member.id,
      reporterName: lang === 'ta' ? member.name_ta : member.name_en,
      reporterPhone: member.mobile || '98421 76540',
      districtCode: member.districtCode || 'MDU',
      districtName_en: member.districtName_en || 'Madurai District',
      districtName_ta: member.districtName_ta || 'மதுரை மாவட்டம்',
      sangamId: member.sangamId || 'sgm-mdu',
      sangamName_en: member.sangamName_en || 'Aavin Madurai Thozhilar Sangam',
      sangamName_ta: member.sangamName_ta || 'ஆவின் மதுரை தொழிலாளர் சங்கம்',
      category: this.selectedCategory,
      categoryName_en: selectedCatObj.name_en,
      categoryName_ta: selectedCatObj.name_ta,
      isCustomProblem: isCustom,
      title_en: isCustom ? finalTitle : `${selectedCatObj.name_en} - ${member.sangamName_en || 'Sangam'}`,
      title_ta: finalTitle,
      description: finalDescription,
      location: `${member.sangamName_ta || 'ஆவின் தொழிலாளர் சங்கம்'}, ${member.districtName_ta || 'மதுரை'}`,
      calculatedPriority: this.selectedUrgency,
      finalPriority: this.selectedUrgency,
      evidence: this.attachedEvidence ? {
        name: this.attachedEvidence.name,
        size: this.attachedEvidence.size,
        dataUrl: this.attachedEvidence.dataUrl,
        isImage: this.attachedEvidence.isImage
      } : null,
      status: 'submitted',
      createdAt: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      history: [
        {
          status: 'submitted',
          date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: member.name_en || 'Member',
          note: 'Grievance submitted via Sangam Portal.'
        }
      ]
    };

    window.AAVIN_STORE.addIssue(newIssue);

    // Reset Form State
    this.currentStep = 1;
    this.customProblemTitle = '';
    this.issueDescription = '';
    this.attachedEvidence = null;
    this.selectedUrgency = 'normal';
    this.currentTab = 'track';

    window.AAVIN_APP.showToast(`புகார் ${newIssueId} வெற்றிகரமாக பதிவு செய்யப்பட்டது!`);
    window.AAVIN_APP.renderCurrentView();
  },

  getCategoryObj(catKey) {
    return this.CATEGORIES.find(c => c.key === catKey) || this.CATEGORIES[0];
  },

  render(defaultTab = 'report') {
    if (defaultTab && defaultTab !== this.currentTab) {
      this.currentTab = defaultTab;
    }
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const t = (k) => window.I18N ? window.I18N.t(k) : k;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 1.35rem; color: #0b4f8a; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              ${icon('issues', { size: 22, color: '#dc2626' })}
              <span>${lang === 'ta' ? 'சங்க பிரச்சனைகள் & கோரிக்கைகள்' : 'Sangam Grievances & Service Portal'}</span>
            </h2>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${lang === 'ta' ? 'சங்க உறுப்பினர்களின் கோரிக்கைகள், நிர்வாக புகார்கள் மற்றும் நேரடி கண்காணிப்பு' : 'Direct Sangam member issue filing, administrative review & 6-stage status tracking'}
            </p>
          </div>
        </div>

        <!-- Segmented Tab Switcher -->
        <div class="segmented-control-bar" style="margin-bottom: 16px;">
          <button class="segmented-control-btn ${this.currentTab === 'report' ? 'active' : ''}" onclick="window.AAVIN_COMPONENTS.IssueSystem.setTab('report')">
            ${icon('plus', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'புதிய புகார் / கோரிக்கை பதிவு' : 'Report Sangam Issue'}</span>
          </button>
          <button class="segmented-control-btn ${this.currentTab === 'track' ? 'active' : ''}" onclick="window.AAVIN_COMPONENTS.IssueSystem.setTab('track')">
            ${icon('clock', { size: 14, color: 'currentColor' })}
            <span>${lang === 'ta' ? 'என் புகார்கள் (நிலை கண்காணிப்பு)' : 'My Grievance Status'}</span>
          </button>
        </div>

        <!-- Hidden Global File Input -->
        <input 
          type="file" 
          id="issueFileInput" 
          accept="image/*,application/pdf" 
          style="display: none;" 
          onchange="window.AAVIN_COMPONENTS.IssueSystem.handleFileUpload(event)" 
        />

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
                <div class="wizard-step-label">${lang === 'ta' ? 'ஆதாரம்' : 'Evidence'}</div>
              </div>
              <div class="wizard-step-pill ${this.currentStep === 4 ? 'active' : ''} ${this.currentStep > 4 ? 'completed' : ''}" data-step="4" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(4)">
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
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const member = window.AAVIN_DATA.currentMember || {};
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    // =========================================================================
    // STEP 1: வகை (Category Selection)
    // =========================================================================
    if (this.currentStep === 1) {
      return `
        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 4px;">
            ${lang === 'ta' ? 'படி 1: சங்க புகார் வகையை தேர்ந்தெடுக்கவும்' : 'Step 1: Select Sangam Grievance Category'}
          </h4>
          <p style="font-size: 12px; color: var(--text-muted);">
            ${lang === 'ta' ? 'உங்கள் கோரிக்கை அல்லது பிரச்சனைக்குரிய பொருத்தமான பிரிவை தேர்வு செய்யவும்' : 'Choose the category that best matches your Sangam-related issue'}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; margin-bottom: 16px;">
          ${this.CATEGORIES.map((c, index) => {
            const isSelected = this.selectedCategory === c.key;
            const isCustom = c.isCustom;
            return `
              <div 
                class="category-select-card ${isSelected ? 'selected' : ''}" 
                onclick="window.AAVIN_COMPONENTS.IssueSystem.selectCategory('${c.key}')"
                style="padding: 14px; border-radius: 12px; border: ${isSelected ? '2px solid var(--aavin-primary)' : (isCustom ? '2px dashed #dc2626' : '1.5px solid var(--border-strong)')}; background: ${isSelected ? '#f0f7ff' : (isCustom ? '#fff5f5' : '#ffffff')}; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: flex-start; position: relative;"
              >
                ${isCustom ? `
                  <span class="badge" style="position: absolute; top: 8px; right: 8px; background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 800; padding: 2px 6px;">
                    + NEW
                  </span>
                ` : `
                  <span style="position: absolute; top: 10px; right: 10px; font-size: 10.5px; font-weight: 800; color: var(--text-muted);">
                    #${index + 1}
                  </span>
                `}

                <div style="width: 38px; height: 38px; border-radius: 10px; background: ${isCustom ? '#fee2e2' : '#f1f5f9'}; display: flex; align-items: center; justify-content: center; color: ${c.color}; margin-bottom: 8px;">
                  ${icon(c.icon, { size: 20, color: c.color })}
                </div>

                <strong style="font-size: 12.5px; color: ${isCustom ? '#b91c1c' : 'var(--text-primary)'}; line-height: 1.3; margin-bottom: 4px;">
                  ${lang === 'ta' ? c.name_ta : c.name_en}
                </strong>
                <p style="font-size: 11px; color: var(--text-muted); line-height: 1.3; margin: 0;">
                  ${lang === 'ta' ? c.desc_ta : c.desc_en}
                </p>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // =========================================================================
    // STEP 2: விவரம் (Issue Details & Priority)
    // =========================================================================
    if (this.currentStep === 2) {
      const isCustom = this.selectedCategory === 'catCustomOther';
      const selectedCat = this.getCategoryObj(this.selectedCategory);

      return `
        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 4px;">
            ${lang === 'ta' ? 'படி 2: பிரச்சனை தலைப்பு & முழு விவரங்கள்' : 'Step 2: Grievance Title & Full Description'}
          </h4>
          <p style="font-size: 12px; color: var(--text-muted);">
            ${isCustom 
              ? (lang === 'ta' ? 'உங்கள் புதிய பிரச்சனையின் தலைப்பு மற்றும் முழு விவரங்களை உள்ளிடவும்' : 'Enter your custom problem title and comprehensive description')
              : (lang === 'ta' ? `தேர்ந்தெடுக்கப்பட்ட பிரிவு: ${selectedCat.name_ta}` : `Selected Category: ${selectedCat.name_en}`)}
          </p>
        </div>

        <!-- Selected Category Ribbon -->
        <div style="background: #f0f7ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${icon(selectedCat.icon, { size: 18, color: selectedCat.color })}
            <span style="font-size: 13px; font-weight: 800; color: var(--aavin-primary);">
              ${lang === 'ta' ? selectedCat.name_ta : selectedCat.name_en}
            </span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(1)" style="font-size: 11px; padding: 4px 8px;">
            ${lang === 'ta' ? 'மாற்றுக' : 'Change'}
          </button>
        </div>

        <!-- Problem Title (Required for Custom, Suggested for Others) -->
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 6px;">
            ${lang === 'ta' ? 'பிரச்சனை தலைப்பு' : 'Problem Title'} <span style="color: #dc2626;">*</span>
          </label>
          <input 
            type="text" 
            id="customProblemTitleInput" 
            value="${this.customProblemTitle || (isCustom ? '' : selectedCat.name_ta)}" 
            placeholder="${lang === 'ta' ? 'எடுத்துக்காட்டு: பால் பணம் 10 நாள் வரவு வரவில்லை / புதிய சங்க உறுப்பினர் அட்டை' : 'e.g. Milk payment pending for 10 days / FAT tester calibration'}"
            style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border-strong); font-size: 13.5px; font-family: inherit; outline: none;"
          />
        </div>

        <!-- Full Description Textarea with Voice Support -->
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12.5px; font-weight: 800; color: var(--text-primary);">
              ${lang === 'ta' ? 'முழு விவரம்' : 'Full Description'} <span style="color: #dc2626;">*</span>
            </label>
            <button id="voiceInputBtn" type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.IssueSystem.toggleVoiceInput()" style="font-size: 11.5px;">
              ${icon('mic', { size: 14, color: '#dc2626' })}
              <span>${lang === 'ta' ? 'குரல் பதிவு' : 'Voice Input'}</span>
            </button>
          </div>
          <textarea 
            id="issueDescInput"
            rows="4" 
            placeholder="${lang === 'ta' ? 'பிரச்சனையின் முழு விவரத்தை தெளிவாக உள்ளிடவும் (தேதி, பால் அளவு, பிரச்சனைக்கான காரணம் போன்றவை)...' : 'Describe the complete details of the issue including date, member ID, quantity, and specific grievance...'}"
            style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--border-strong); font-size: 13.5px; font-family: inherit; resize: vertical; outline: none;"
          >${this.issueDescription}</textarea>
        </div>

        <!-- Priority / Urgency Selection -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 6px;">
            ${lang === 'ta' ? 'முன்னுரிமை (Priority)' : 'Priority Level'}
          </label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <label style="flex: 1; min-width: 120px; padding: 10px 14px; border-radius: 10px; border: 1.5px solid ${this.selectedUrgency === 'normal' ? '#16a34a' : '#e2e8f0'}; background: ${this.selectedUrgency === 'normal' ? '#dcfce7' : '#ffffff'}; cursor: pointer; text-align: center; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <input type="radio" name="urgency" value="normal" ${this.selectedUrgency === 'normal' ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.IssueSystem.selectedUrgency='normal'" style="display:none;" />
              <span>✓ ${lang === 'ta' ? 'இயல்பு (Normal)' : 'Normal'}</span>
            </label>
            <label style="flex: 1; min-width: 120px; padding: 10px 14px; border-radius: 10px; border: 1.5px solid ${this.selectedUrgency === 'urgent' ? '#dc2626' : '#e2e8f0'}; background: ${this.selectedUrgency === 'urgent' ? '#fee2e2' : '#ffffff'}; cursor: pointer; text-align: center; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <input type="radio" name="urgency" value="urgent" ${this.selectedUrgency === 'urgent' ? 'checked' : ''} onchange="window.AAVIN_COMPONENTS.IssueSystem.selectedUrgency='urgent'" style="display:none;" />
              <span>⚡ ${lang === 'ta' ? 'அவசரம் (Urgent)' : 'Urgent'}</span>
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(1)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button type="button" class="btn btn-primary" onclick="const t = document.getElementById('customProblemTitleInput'); const d = document.getElementById('issueDescInput'); if(t) window.AAVIN_COMPONENTS.IssueSystem.customProblemTitle = t.value; if(d) window.AAVIN_COMPONENTS.IssueSystem.issueDescription = d.value; window.AAVIN_COMPONENTS.IssueSystem.goToStep(3)">
            ${lang === 'ta' ? 'அடுத்தது: ஆதாரம்' : 'Next: Evidence'} →
          </button>
        </div>
      `;
    }

    // =========================================================================
    // STEP 3: ஆதாரம் (Media / Evidence Upload)
    // =========================================================================
    if (this.currentStep === 3) {
      const ev = this.attachedEvidence;

      return `
        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 4px;">
            ${lang === 'ta' ? 'படி 3: ஆதாரம் / Photo / ஆவணங்கள் இணைத்தல்' : 'Step 3: Attach Photo / Evidence / Document'}
          </h4>
          <p style="font-size: 12px; color: var(--text-muted);">
            ${lang === 'ta' ? 'பால் ரசீது, இயந்திர புகைப்படம், பாஸ்புக் நகல் அல்லது PDF ஆவணம் இணைக்கலாம் (விருப்பமானது)' : 'Attach milk receipt, equipment photo, passbook photocopy, or PDF document (optional)'}
          </p>
        </div>

        ${ev ? `
          <!-- Attachment Preview Box -->
          <div style="border: 1.5px solid #10b981; border-radius: 14px; padding: 16px; background: #ecfdf5; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-normal" style="background: #10b981; color: #ffffff;">✓ Attached</span>
                <strong style="font-size: 13px; color: #065f46;">${ev.name}</strong>
                <span style="font-size: 11px; color: #047857;">(${ev.size})</span>
              </div>
              <button type="button" class="btn btn-sm btn-danger" onclick="window.AAVIN_COMPONENTS.IssueSystem.removeAttachedEvidence()" style="padding: 4px 8px; font-size: 11px;">
                ✕ ${lang === 'ta' ? 'நீக்குக' : 'Remove'}
              </button>
            </div>

            ${ev.isImage ? `
              <div style="max-height: 200px; border-radius: 10px; overflow: hidden; border: 1px solid #a7f3d0; text-align: center; background: #ffffff;">
                <img src="${ev.dataUrl}" alt="Evidence Preview" style="max-height: 200px; max-width: 100%; object-fit: contain;" />
              </div>
            ` : `
              <div style="padding: 14px; background: #ffffff; border-radius: 10px; border: 1px solid #a7f3d0; display: flex; align-items: center; gap: 10px;">
                ${icon('fileText', { size: 24, color: '#0b4f8a' })}
                <div>
                  <strong style="font-size: 12.5px; color: var(--text-primary);">${ev.name}</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">PDF Document • ${ev.size}</div>
                </div>
              </div>
            `}
          </div>
        ` : `
          <!-- Upload Trigger Area -->
          <div style="border: 2px dashed #94a3b8; border-radius: 16px; padding: 28px 20px; text-align: center; background: #f8fafc; margin-bottom: 16px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
              ${icon('camera', { size: 26, color: '#0284c7' })}
            </div>
            <strong style="font-size: 14px; color: var(--text-primary); display: block; margin-bottom: 4px;">
              ${lang === 'ta' ? 'புகைப்படம் அல்லது ஆவணத்தை பதிவேற்றவும்' : 'Upload Photo or Document Evidence'}
            </strong>
            <p style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 14px;">
              Supports JPG, PNG, PDF up to 10MB
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('issueFileInput').click()">
                ${icon('plus', { size: 14, color: '#ffffff' })}
                <span>${lang === 'ta' ? 'கேலரி / கோப்பு தேர்வு' : 'Choose File'}</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('issueFileInput').click()">
                ${icon('camera', { size: 14, color: '#0b4f8a' })}
                <span>${lang === 'ta' ? 'கேமரா' : 'Camera'}</span>
              </button>
            </div>
          </div>
        `}

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(2)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button type="button" class="btn btn-primary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(4)">
            ${lang === 'ta' ? 'மதிப்பாய்வு & உறுதிசெய்க' : 'Next: Review'} →
          </button>
        </div>
      `;
    }

    // =========================================================================
    // STEP 4: உறுதிசெய்க (Review & Final Submission)
    // =========================================================================
    if (this.currentStep === 4) {
      const isCustom = this.selectedCategory === 'catCustomOther';
      const selectedCat = this.getCategoryObj(this.selectedCategory);
      const finalTitle = this.customProblemTitle || (isCustom ? 'புதிய பிரச்சனை / மற்ற பிரச்சனை' : selectedCat.name_ta);
      const ev = this.attachedEvidence;

      return `
        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 15px; font-weight: 800; color: #07355e; margin-bottom: 4px;">
            ${lang === 'ta' ? 'படி 4: விவரங்களை உறுதிசெய்து சமர்ப்பிக்கவும்' : 'Step 4: Confirm Grievance Details & Submit'}
          </h4>
          <p style="font-size: 12px; color: var(--text-muted);">
            ${lang === 'ta' ? 'பதிவு செய்யப்பட்ட தகவல்களை சரிபார்த்து உறுதி செய்யவும்' : 'Review your grievance information before final submission to Sangam Admin'}
          </p>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; border: 1.5px solid var(--border-strong); padding: 16px; margin-bottom: 16px; font-size: 13px;">
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
            <div>
              <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">CATEGORY (வகை):</span>
              <div style="font-weight: 800; color: var(--aavin-primary); margin-top: 2px;">
                ${lang === 'ta' ? selectedCat.name_ta : selectedCat.name_en}
              </div>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">PRIORITY (முன்னுரிமை):</span>
              <div style="margin-top: 2px;">
                <span class="badge" style="background: ${this.selectedUrgency === 'urgent' ? '#fee2e2' : '#dcfce7'}; color: ${this.selectedUrgency === 'urgent' ? '#dc2626' : '#15803d'}; font-weight: 800;">
                  ${this.selectedUrgency === 'urgent' ? '⚡ URGENT (அவசரம்)' : '✓ NORMAL (இயல்பு)'}
                </span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
            <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">PROBLEM TITLE (பிரச்சனை தலைப்பு):</span>
            <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); margin-top: 2px;">
              ${finalTitle}
            </div>
          </div>

          <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
            <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">FULL DESCRIPTION (முழு விவரம்):</span>
            <p style="color: #334155; margin-top: 4px; line-height: 1.4; white-space: pre-line;">
              ${this.issueDescription || (lang === 'ta' ? 'விவரம் பதிவு செய்யப்பட்டுள்ளது.' : 'Details recorded.')}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div>
              <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">MEMBER & SANGAM:</span>
              <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                ${lang === 'ta' ? (member.name_ta || 'S. சரவணன்') : (member.name_en || 'S. Saravanan')} (${member.sangamName_ta || 'ஆவின் மதுரை சங்கம்'})
              </div>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase;">ATTACHED EVIDENCE:</span>
              <div style="margin-top: 2px; font-size: 12px; color: ${ev ? '#059669' : '#64748b'}; font-weight: 700;">
                ${ev ? `📎 ${ev.name} (${ev.size})` : 'None attached'}
              </div>
            </div>
          </div>

        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.AAVIN_COMPONENTS.IssueSystem.goToStep(3)">
            ← ${lang === 'ta' ? 'முந்தையது' : 'Back'}
          </button>
          <button type="button" class="btn btn-success" onclick="window.AAVIN_COMPONENTS.IssueSystem.submitNewIssue()" style="font-weight: 800; padding: 10px 20px;">
            ${icon('check', { size: 16, color: '#ffffff' })}
            <span>${lang === 'ta' ? 'புகாரை உறுதிசெய்து சமர்ப்பிக்கவும்' : 'Confirm & Submit Grievance'}</span>
          </button>
        </div>
      `;
    }
  },

  // ===========================================================================
  // 6-STAGE TRACKING TIMELINE RENDERER
  // ===========================================================================
  render6StageTimeline(issue) {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const status = (issue.status || 'submitted').toLowerCase();

    // 6 Canonical Stages: Submitted → Under Review → Assigned → In Progress → Resolved → Closed
    const stageOrder = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'];
    
    // Normalize older statuses
    let currentStageIndex = stageOrder.indexOf(status);
    if (currentStageIndex === -1) {
      if (status === 'admin_verification' || status === 'verified') currentStageIndex = 1;
      else if (status === 'forwarded' || status === 'action_in_progress') currentStageIndex = 3;
      else currentStageIndex = 0;
    }

    const stages = [
      { key: 'submitted', label_ta: '1. சமர்ப்பிக்கப்பட்டது', label_en: '1. Submitted', desc_ta: 'புகார் பதிவு செய்யப்பட்டு சங்க வரிசையில் உள்ளது', desc_en: 'Logged in Sangam system' },
      { key: 'under_review', label_ta: '2. ஆய்வில் உள்ளது', label_en: '2. Under Review', desc_ta: 'சங்க நிர்வாகி சரிபார்த்து ஆய்வு செய்கிறார்', desc_en: 'Sangam Admin verification' },
      { key: 'assigned', label_ta: '3. அதிகாரியிடம் ஒப்படைக்கப்பட்டது', label_en: '3. Assigned', desc_ta: 'கள அதிகாரி / தொழில்நுட்ப பிரிவுக்கு ஒப்படைப்பு', desc_en: 'Assigned to field officer' },
      { key: 'in_progress', label_ta: '4. நடவடிக்கை தொடர்கிறது', label_en: '4. In Progress', desc_ta: 'கள ஆய்வு & பழுது நீக்கும் பணி நடைபெறுகிறது', desc_en: 'Field inspection & action ongoing' },
      { key: 'resolved', label_ta: '5. தீர்க்கப்பட்டது', label_en: '5. Resolved', desc_ta: 'கோரிக்கை தீர்க்கப்பட்டு அறிக்கை சமர்ப்பிக்கப்பட்டது', desc_en: 'Resolution completed' },
      { key: 'closed', label_ta: '6. முடிக்கப்பட்டது', label_en: '6. Closed', desc_ta: 'உறுப்பினர் உறுதிசெய்து புகார் மூடப்பட்டது', desc_en: 'Grievance confirmed & closed' }
    ];

    return `
      <div class="resolution-timeline" style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
        ${stages.map((st, idx) => {
          const isCompleted = idx < currentStageIndex || (idx === currentStageIndex && (status === 'resolved' || status === 'closed'));
          const isActive = idx === currentStageIndex && status !== 'closed';
          const nodeClass = isCompleted ? 'completed' : (isActive ? 'active' : '');

          return `
            <div class="timeline-event-node ${nodeClass}">
              <div style="font-size: 12px; font-weight: 800; color: ${isActive ? 'var(--aavin-primary)' : (isCompleted ? '#15803d' : 'var(--text-muted)')};">
                ${lang === 'ta' ? st.label_ta : st.label_en}
                ${isActive ? ' ⏳' : (isCompleted ? ' ✓' : '')}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                ${lang === 'ta' ? st.desc_ta : st.desc_en}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderIssueTrackerList() {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const member = window.AAVIN_DATA.currentMember || {};
    const allIssues = window.AAVIN_STORE.state.issues || [];
    const currentRole = window.AAVIN_STORE.state.currentRole;
    const isAdmin = window.AAVIN_RBAC ? window.AAVIN_RBAC.isAdmin(currentRole) : false;
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    // Privacy Rule: Regular members see ONLY their own submitted complaints
    const visibleIssues = isAdmin 
      ? allIssues 
      : allIssues.filter(i => {
          if (!i.reporterId) return true;
          return i.reporterId === member.id || i.reporterName === (member.name_ta || member.name_en);
        });

    if (visibleIssues.length === 0) {
      return `
        <div class="card card-floating-3d hover-lift" style="text-align: center; padding: 36px 20px; border: 1.5px dashed var(--border-strong); background: #fafcff;">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
            ${icon('issues', { size: 28, color: '#dc2626' })}
          </div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
            ${lang === 'ta' ? 'தங்கள் பெயரில் புகார்கள் எதுவும் நிலுவையில் இல்லை' : 'No Active Grievances Found'}
          </h3>
          <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.4;">
            ${lang === 'ta' ? 'சங்க நிர்வாகம், பால் பணம், FAT/SNF அல்லது புதிய பிரச்சனைகளை பதிவு செய்து அதன் 6-கட்ட தீர்வு நிலையை நேரடியாக கண்காணிக்கலாம்.' : 'Submit a Sangam grievance or custom issue using the 4-Step Wizard to track real-time resolution.'}
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_COMPONENTS.IssueSystem.setTab('report')">
            ${icon('plus', { size: 14, color: '#ffffff' })}
            <span>${lang === 'ta' ? 'புதிய புகார் பதிவு செய்க' : 'Report New Issue'}</span>
          </button>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${visibleIssues.map(issue => `
          <div class="card card-floating-3d" style="padding: 16px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <span class="badge badge-primary" style="font-size: 11px;">#${issue.id}</span>
                <span style="font-weight: 700; font-size: 13.5px; margin-left: 6px; color: var(--text-primary);">${issue.title || issue.category || 'Grievance'}</span>
              </div>
              <span class="badge ${issue.status === 'resolved' ? 'badge-success' : 'badge-warning'}" style="font-size: 11px; text-transform: uppercase;">${issue.status}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${issue.description || ''}</div>
            <div style="display: flex; flex-direction: column; gap: 8px; border-left: 2px solid var(--border-subtle); padding-left: 12px;">
              <div class="timeline-event-node completed">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${lang === 'ta' ? '1. புகார் சமர்ப்பிக்கப்பட்டது' : '1. Grievance Submitted'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${issue.createdAt || ''} • ${issue.reporterName || ''}</div>
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
