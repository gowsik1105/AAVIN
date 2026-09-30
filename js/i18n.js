/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Bilingual Localization Dictionary (English & தமிழ்)
 */

window.I18N = {
  currentLang: 'ta', // Default to Tamil as requested for TN Govt local ease of use

  translations: {
    en: {
      appName: 'Aavin Sangam',
      appSubTitle: 'Govt of Tamil Nadu • Dairy Development Department',
      govOfTn: 'Government of Tamil Nadu',
      tagline: 'Simple outside, powerful inside',

      // Roles
      role_member: 'Member',
      role_sangam_admin: 'Sangam Admin',
      role_district_admin: 'District Admin',
      role_state_admin: 'State Govt Admin',

      // Top bar & Status
      online: 'Online',
      offline: 'Offline (Draft Mode)',
      notifications: 'Notifications',
      quickSearch: 'Search...',
      switchRole: 'Switch Role:',

      // Navigation
      navHome: 'Home',
      navNews: 'News',
      navMeetings: 'Meetings',
      navIssues: 'Issues',
      navDairies: 'Main Dairies',
      navMore: 'More',
      navMap: 'Aavin Map',
      navDigitalId: 'Digital ID',
      navDocuments: 'Documents',
      navHelp: 'Help Center',
      navSettings: 'Settings',
      navProfile: 'Profile',
      navAnalytics: 'Analytics',
      navHeatmap: 'Issue Heatmap',

      // Main Dairy Finder Keys
      dairyFinderTitle: 'Aavin Main Dairy & Processing Plant Finder',
      dairyFinderSubtitle: 'Tamil Nadu Verified Dairy Infrastructure',
      strictFilterNotice: 'STRICT FILTER: Showing ONLY verified Main Dairies & Processing Plants. Excludes BMCs, Chilling Centres, and Milk Booths.',
      facility_MAIN_DAIRY: 'Main Dairy',
      facility_DAIRY_PLANT: 'Dairy Plant',
      facility_PROCESSING_UNIT: 'Processing Unit',
      facility_FEEDER_BALANCING_DAIRY: 'Feeder Balancing Dairy',
      facility_SPECIALISED_DAIRY_PLANT: 'Specialised Dairy Plant',
      verification_VERIFIED: 'Verified',
      verification_CROSS_VERIFIED: 'Cross-Verified',
      verification_NEEDS_VERIFICATION: 'Needs Verification',
      findNearestDairy: '📍 Find Nearest Main Dairy',
      getDirections: '🗺️ Directions (Google Maps)',
      searchDairyPlaceholder: 'Search by dairy name, district, or city...',
      allDistricts: 'All Districts',
      allFacilityTypes: 'All Facility Types',
      adminAddDairy: '➕ Add Main Dairy',
      adminEditDairy: 'Edit Facility',
      adminDeleteDairy: 'Delete Facility',
      sourceAttribution: 'Verified Source:',
      lastVerified: 'Last Verified:',
      kmAway: 'km away',

      // Greetings & Member Home
      greetingMorning: 'Good Morning',
      greetingAfternoon: 'Good Afternoon',
      greetingEvening: 'Good Evening',
      maduraiDistrict: 'Madurai District',
      mySangam: 'Aavin Madurai Thozhilar Sangam',
      sangamRegNo: 'Reg No: TN-MDU-TS-8841',
      president: 'President',
      secretary: 'Secretary',
      treasurer: 'Treasurer',
      contactOffice: 'Official Contact',
      callNow: 'Call Office',

      // Home Cards
      cardSangamTitle: 'Madurai Aavin Sangam',
      cardPriorityTitle: 'Priority Issues',
      cardUpdatesTitle: 'Important Updates',
      cardNextMeetingTitle: 'Next Meeting',
      cardDigitalIdTitle: 'My Digital ID',
      viewAll: 'View All',
      quickActions: 'Quick Actions',

      // Issue Reporting
      reportIssueBtn: 'Report an Issue',
      trackIssuesBtn: 'Track My Issues',
      issueCategory: 'Issue Category',
      issueCategoryPlaceholder: 'Select Category',
      catInfrastructure: 'Infrastructure & Building',
      catChillingPlant: 'Bulk Milk Cooler / Chiller Unit',
      catTestingEquipment: 'Milk Fat / SNF Testing Analyzer',
      catSubsidyPayment: 'Incentive & Milk Payment Settlement',
      catVeterinary: 'Veterinary Doctor & Cattle Health',
      catAdminDoc: 'Passbook & Documentation',
      problemDescription: 'Problem Description',
      problemPlaceholder: 'Describe the issue clearly...',
      speakProblem: 'Speak Your Problem (Voice Input)',
      listeningTamil: 'Listening in Tamil / English... speak now',
      takePhoto: 'Take Photo / Upload Evidence',
      attachDoc: 'Attach Document (Optional)',
      submitIssue: 'Submit Issue',
      issueSubmittedSuccess: 'Issue submitted successfully! Tracking ID:',
      draftSavedOffline: 'Saved as draft offline. Will sync automatically when online.',

      // Clustering & Priority
      relatedReportsDetected: 'related reports detected',
      systemPriorityAlert: 'Automated Priority Rating:',
      priorityCritical: 'Critical',
      priorityHigh: 'High',
      priorityMedium: 'Medium',
      priorityNormal: 'Normal',

      // Issue Status & Forwarding
      statusSubmitted: 'Submitted',
      statusAdminVerification: 'Admin Verification',
      statusVerified: 'Verified',
      statusForwarded: 'Forwarded to Govt Dept',
      statusAssigned: 'Assigned to Engineer',
      statusActionInProgress: 'Action in Progress',
      statusResolved: 'Resolved',
      statusClosed: 'Closed',
      statusEscalated: 'Escalated to District HQ',

      forwardToGovt: 'Forward to Concerned Government Dept',
      deptDairyDev: 'Department of Dairy Development (GoTN)',
      deptAnimalHusbandry: 'Animal Husbandry Department',
      deptTNEB: 'TNEB Power Infrastructure Division',
      deptPWD: 'Public Works Department (PWD Dairy Cell)',

      // Meetings
      joinLiveMeeting: 'Join Meeting',
      scheduleMeeting: 'Schedule Meeting',
      liveMeetingRoom: 'Live Conference Room',
      meetingRecordingLib: 'Meeting Recording Library',
      meetingNotesDecisions: 'Meeting Notes & Action Decisions',
      micOn: 'Mute',
      micOff: 'Unmute',
      camOn: 'Camera Off',
      camOff: 'Camera On',
      raiseHand: 'Raise Hand',
      screenShare: 'Share Screen',
      leaveMeeting: 'Leave Meeting',
      attendanceRegister: 'Verified Attendance',
      decisionsTaken: 'Action Decisions',
      responsiblePerson: 'Responsible Officer / Dept',
      dueDate: 'Target Due Date',
      taskStatus: 'Status',

      // Digital ID Card
      govtOfTnAavin: 'Government of Tamil Nadu • Aavin Co-operative',
      idMembershipCard: 'OFFICIAL SANGAM DIGITAL ID',
      idMemberName: 'Member Name',
      idMemberId: 'Member ID',
      idDistrictSangam: 'District / Sangam',
      idValidTill: 'Valid Until',
      idScanToVerify: 'Click QR to Verify Authenticity',
      idOfficialSeal: 'TAMIL NADU CO-OPERATIVE VERIFIED',
      idPrintCard: 'Download / Print ID',

      // Universal Search & Help
      searchPlaceholder: 'Search members, Sangams, news, circulars, issue IDs...',
      needHelp: 'Need Help?',
      tollFreeHelpline: 'Toll-Free Helpline (Tamil Nadu Dairy Support): 1800-425-4422',
      whatsappSupport: 'Aavin District WhatsApp Help: +91 94431 00000',
      faq1Title: 'How to report a milk collection or chiller issue?',
      faq1Desc: 'Click "Report an Issue", tap the microphone to speak your problem in Tamil, or click take photo and tap Submit.',
      faq2Title: 'How to join monthly Sangam meetings?',
      faq2Desc: 'Go to Meetings tab and tap "Join Meeting" at the scheduled time. No password required for verified members.',
      faq3Title: 'How to verify your Digital ID card?',
      faq3Desc: 'Tap on the QR code on your Digital ID card to display the official government verification certificate.',

      // Map
      exploreSangams: 'Explore Authorized Aavin Sangams',
      selectDistrict: 'Select District',
      viewSangamProfile: 'View Sangam Profile',
      membersEnrolled: 'Active Members',
      dailyCollection: 'Daily Milk Procurement'
    },

    ta: {
      appName: 'ஆவின் சங்கம்',
      appSubTitle: 'தமிழ்நாடு அரசு • பால்வளத்துறை',
      govOfTn: 'தமிழ்நாடு அரசு',
      tagline: 'வெளியே எளிமை, உள்ளே வலிமை',

      // Roles
      role_member: 'உறுப்பினர்',
      role_sangam_admin: 'சங்க நிர்வாகி',
      role_district_admin: 'மாவட்ட நிர்வாகி',
      role_state_admin: 'மாநில அரசு நிர்வாகி',

      // Top bar & Status
      online: 'இணைப்பில் உள்ளது',
      offline: 'ஆஃப்லைன் (வரைவு முறை)',
      notifications: 'அறிவிப்புகள்',
      quickSearch: 'தேடுங்கள்...',
      switchRole: 'பொறுப்பு மாற்றம்:',

      // Navigation
      navHome: 'முகப்பு',
      navNews: 'செய்திகள்',
      navMeetings: 'கூட்டங்கள்',
      navIssues: 'பிரச்சனைகள்',
      navDairies: 'முதன்மை பால் பண்ணைகள்',
      navMore: 'கூடுதல்',
      navMap: 'ஆவின் வரைபடம்',
      navDigitalId: 'டிஜிட்டல் அடையாள அட்டை',
      navDocuments: 'அரசு ஆவணங்கள்',
      navHelp: 'உதவி மையம்',
      navSettings: 'அமைப்புகள்',
      navProfile: 'சுயவிவரம்',
      navAnalytics: 'புள்ளிவிவரங்கள்',
      navHeatmap: 'பிரச்சனை வரைபடம்',

      // Main Dairy Finder Keys (Tamil)
      dairyFinderTitle: 'ஆவின் முதன்மை பால் பண்ணைகள் & பதப்படுத்தும் ஆலைகள்',
      dairyFinderSubtitle: 'தமிழ்நாடு அரசு அங்கீகரிக்கப்பட்ட உள்கட்டமைப்பு',
      strictFilterNotice: 'கண்டிப்பான விதிமுறை: தமிழ்நாட்டின் அங்கீகரிக்கப்பட்ட முதன்மை பால் பண்ணைகள் மட்டுமே காட்டப்படுகின்றன. குளிரூட்டும் நிலையங்கள் (BMC) மற்றும் பால் பூத்கள் தவிர்க்கப்பட்டுள்ளன.',
      facility_MAIN_DAIRY: 'முதன்மை பால் பண்ணை',
      facility_DAIRY_PLANT: 'பால் பதப்படுத்தும் ஆலை',
      facility_PROCESSING_UNIT: 'பால் உற்பத்தி பிரிவு',
      facility_FEEDER_BALANCING_DAIRY: 'ஃபீடர் பேலன்சிங் பால் பண்ணை',
      facility_SPECIALISED_DAIRY_PLANT: 'சிறப்பு பால் உற்பத்தி ஆலை',
      verification_VERIFIED: 'சரிபார்க்கப்பட்டது',
      verification_CROSS_VERIFIED: 'மறுசரிபார்ப்பு செய்யப்பட்டது',
      verification_NEEDS_VERIFICATION: 'சரிபார்ப்பு தேவை',
      findNearestDairy: '📍 அருகிலுள்ள முதன்மை பால் பண்ணை',
      getDirections: '🗺️ வழித்தடம் (Google Maps)',
      searchDairyPlaceholder: 'பால் பண்ணை பெயர், மாவட்டம், ஊர் தேடுங்கள்...',
      allDistricts: 'அனைத்து மாவட்டங்கள்',
      allFacilityTypes: 'அனைத்து ஆலை வகைகள்',
      adminAddDairy: '➕ புதிய பால் பண்ணை சேர்க்க',
      adminEditDairy: 'பண்ணை விவரம் திருத்து',
      adminDeleteDairy: 'பண்ணை நீக்கு',
      sourceAttribution: 'அங்கீகரிக்கப்பட்ட மூலம்:',
      lastVerified: 'கடைசி சரிபார்ப்பு:',
      kmAway: 'கி.மீ தொலைவில்',

      // Greetings & Member Home
      greetingMorning: 'காலை வணக்கம்',
      greetingAfternoon: 'மதிய வணக்கம்',
      greetingEvening: 'மாலை வணக்கம்',
      maduraiDistrict: 'மதுரை மாவட்டம்',
      mySangam: 'ஆவின் மதுரை தொழிலாளர் சங்கம்',
      sangamRegNo: 'பதிவு எண்: TN-MDU-TS-8841',
      president: 'தலைவர்',
      secretary: 'செயலாளர்',
      treasurer: 'பொருளாளர்',
      contactOffice: 'சங்க அலுவலக தொடர்பு',
      callNow: 'அழைக்கவும்',

      // Home Cards
      cardSangamTitle: 'மதுரை ஆவின் சங்கம்',
      cardPriorityTitle: 'முன்னுரிமை பிரச்சனைகள்',
      cardUpdatesTitle: 'முக்கிய அறிவிப்புகள்',
      cardNextMeetingTitle: 'அடுத்த கூட்டம்',
      cardDigitalIdTitle: 'என் டிஜிட்டல் அடையாள அட்டை',
      viewAll: 'அனைத்தையும் பார்க்க',
      quickActions: 'விரைவு செயல்பாடுகள்',

      // Issue Reporting
      reportIssueBtn: 'பிரச்சனையை புகாரளிக்கவும்',
      trackIssuesBtn: 'என் புகார்களை கண்காணிக்கவும்',
      issueCategory: 'பிரச்சனை வகை',
      issueCategoryPlaceholder: 'வகையை தேர்ந்தெடுக்கவும்',
      catInfrastructure: 'கட்டமைப்பு மற்றும் கட்டடம்',
      catChillingPlant: 'பால் குளிரூட்டும் நிலையம் / சிலிங் பிளாண்ட்',
      catTestingEquipment: 'கொழுப்பு / எஸ்.என்.எஃப் பால் பரிசோதனை கருவி',
      catSubsidyPayment: 'பால் கொள்முதல் பணம் & அரசு மானியம்',
      catVeterinary: 'கால்நடை மருத்துவர் & மருத்துவ முகாம்',
      catAdminDoc: 'உறுப்பினர் கையேடு / ஆவணங்கள்',
      problemDescription: 'பிரச்சனையின் விவரம்',
      problemPlaceholder: 'பிரச்சனையை தெளிவாக விவரிக்கவும்...',
      speakProblem: 'உங்கள் பிரச்சனையை பேசுங்கள் (குரல் பதிவு)',
      listeningTamil: 'தமிழில் பேசுங்கள்... உங்கள் குரல் பதிவாகிறது',
      takePhoto: 'புகைப்படம் எடுக்க / ஆதாரம் இணைக்க',
      attachDoc: 'ஆவணம் இணைக்க (விருப்பம்)',
      submitIssue: 'புகாரை சமர்ப்பிக்கவும்',
      issueSubmittedSuccess: 'புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! கண்காணிப்பு எண்:',
      draftSavedOffline: 'இணையம் இல்லை - வரைவாக சேமிக்கப்பட்டது. இணைப்பு வந்ததும் தானாக பதிவேறும்.',

      // Clustering & Priority
      relatedReportsDetected: 'தொடர்புடைய புகார்கள் கண்டறியப்பட்டன',
      systemPriorityAlert: 'கணக்கிடப்பட்ட முன்னுரிமை நிலை:',
      priorityCritical: 'மிக அவசரம்',
      priorityHigh: 'அதிக முன்னுரிமை',
      priorityMedium: 'நடுத்தரம்',
      priorityNormal: 'இயல்பு',

      // Issue Status & Forwarding
      statusSubmitted: 'சமர்ப்பிக்கப்பட்டது',
      statusAdminVerification: 'நிர்வாக சரிபார்ப்பு',
      statusVerified: 'சரிபார்க்கப்பட்டது',
      statusForwarded: 'அரசு துறைக்கு அனுப்பப்பட்டது',
      statusAssigned: 'பொறியாளருக்கு ஒதுக்கப்பட்டது',
      statusActionInProgress: 'நடவடிக்கையில் உள்ளது',
      statusResolved: 'தீர்க்கப்பட்டது',
      statusClosed: 'முடிக்கப்பட்டது',
      statusEscalated: 'மாவட்ட தலைமையகத்திற்கு மாற்றப்பட்டது',

      forwardToGovt: 'சம்பந்தப்பட்ட அரசு துறைக்கு அனுப்பவும்',
      deptDairyDev: 'பால்வளத்துறை (தமிழ்நாடு அரசு)',
      deptAnimalHusbandry: 'கால்நடை பராமரிப்புத்துறை',
      deptTNEB: 'தமிழ்நாடு மின்வாரியம் (TNEB)',
      deptPWD: 'பொதுப்பணித்துறை (PWD பால்வள பிரிவு)',

      // Meetings
      joinLiveMeeting: 'கூட்டத்தில் இணையவும்',
      scheduleMeeting: 'கூட்டம் ஏற்பாடு செய்க',
      liveMeetingRoom: 'நேரலை கூட்ட அறை',
      meetingRecordingLib: 'கூட்டப் பதிவுகள் நூலகம்',
      meetingNotesDecisions: 'கூட்டக் குறிப்புகள் & முடிவுகள்',
      micOn: 'மைக் ஆஃப்',
      micOff: 'மைக் ஆன்',
      camOn: 'கேமரா ஆஃப்',
      camOff: 'கேமரா ஆன்',
      raiseHand: 'கை உயர்த்தவும்',
      screenShare: 'திரை பகிரவும்',
      leaveMeeting: 'வெளியேறு',
      attendanceRegister: 'சரிபார்க்கப்பட்ட வருகைப்பதிவு',
      decisionsTaken: 'எடுக்கப்பட்ட முடிவுகள்',
      responsiblePerson: 'பொறுப்பான அதிகாரி / துறை',
      dueDate: 'இலக்கு தேதி',
      taskStatus: 'நிலை',

      // Digital ID Card
      govtOfTnAavin: 'தமிழ்நாடு அரசு • ஆவின் கூட்டுறவு ஒன்றியம்',
      idMembershipCard: 'அதிகாரப்பூர்வ சங்க உறுப்பினர் டிஜிட்டல் அட்டை',
      idMemberName: 'உறுப்பினர் பெயர்',
      idMemberId: 'உறுப்பினர் எண்',
      idDistrictSangam: 'மாவட்டம் / சங்கம்',
      idValidTill: 'செல்லுபடியாகும் காலம்',
      idScanToVerify: 'சரிபார்க்க QR குறியீட்டைத் தொடவும்',
      idOfficialSeal: 'தமிழ்நாடு கூட்டுறவு சரிபார்க்கப்பட்டது',
      idPrintCard: 'அடையாள அட்டையை பதிவிறக்கு',

      // Universal Search & Help
      searchPlaceholder: 'உறுப்பினர், சங்கம், செய்தி, அறிவிப்பு, புகார் எண் தேடுங்கள்...',
      needHelp: 'உதவி தேவையா?',
      tollFreeHelpline: 'கட்டணமில்லா உதவி எண் (பால்வளத்துறை): 1800-425-4422',
      whatsappSupport: 'மதுரை மாவட்ட ஆவின் வாட்ஸ்அப் உதவி: +91 94431 00000',
      faq1Title: 'பால் கொள்முதல் அல்லது மிஷின் பழுதை எப்படி புகாரளிப்பது?',
      faq1Desc: '"பிரச்சனையை புகாரளிக்கவும்" பொத்தானை அழுத்தி, மைக் பட்டனை தொட்டு தமிழில் பேசலாம் அல்லது புகைப்படம் எடுத்து சமர்ப்பிக்கலாம்.',
      faq2Title: 'மாதாந்திர சங்க கூட்டத்தில் எப்படி இணைவது?',
      faq2Desc: 'கூட்டங்கள் பகுதிக்கு சென்று குறிப்பிட்ட நேரத்தில் "கூட்டத்தில் இணையவும்" என்பதை அழுத்தவும். கடவுச்சொல் தேவையில்லை.',
      faq3Title: 'டிஜிட்டல் அடையாள அட்டையை எப்படி சரிபார்ப்பது?',
      faq3Desc: 'உங்கள் அட்டையிலுள்ள QR குறியீட்டைத் தொட்டால் தமிழ்நாடு அரசின் அதிகாரப்பூர்வ சரிபார்ப்பு சான்றிதழ் திரையில் தோன்றும்.',

      // Map
      exploreSangams: 'அங்கீகரிக்கப்பட்ட ஆவின் சங்கங்களை காண்க',
      selectDistrict: 'மாவட்டத்தை தேர்வு செய்யவும்',
      viewSangamProfile: 'சங்க சுயவிவரம்',
      membersEnrolled: 'செயலில் உள்ள உறுப்பினர்கள்',
      dailyCollection: 'தினசரி பால் கொள்முதல்'
    }
  },

  t(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    if (this.translations['en'] && this.translations['en'][key]) {
      return this.translations['en'][key];
    }
    return key;
  },

  setLang(lang) {
    if (lang === 'ta' || lang === 'en') {
      this.currentLang = lang;
      localStorage.setItem('aavin_lang', lang);
      document.documentElement.lang = lang;
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('aavin:lang-changed', { detail: { lang } }));
      }
    }
  },

  /**
   * High-accuracy phonetic English to Tamil transliteration engine
   * Converts Latin characters into Tamil script (e.g., 'Karthik' -> 'கார்த்திக்', 'Suryakala' -> 'சூர்யகலா')
   */
  transliterateEnToTa(text) {
    if (!text || typeof text !== 'string') return '';

    const INITIALS = {
      'A': 'ஏ', 'B': 'பி', 'C': 'சி', 'D': 'டி', 'E': 'இ',
      'F': 'எஃப்', 'G': 'ஜி', 'H': 'எச்', 'I': 'ஐ', 'J': 'ஜே',
      'K': 'கே', 'L': 'எல்', 'M': 'எம்', 'N': 'என்', 'O': 'ஓ',
      'P': 'பி', 'Q': 'க்யூ', 'R': 'ஆர்', 'S': 'எஸ்', 'T': 'டி',
      'U': 'யு', 'V': 'வி', 'W': 'டபிள்யூ', 'X': 'எக்ஸ்', 'Y': 'ஒய்', 'Z': 'இசட்'
    };

    const tokens = text.split(/(\s+|\.+|\-+|\_+)/);

    return tokens.map(token => {
      if (!token || /^\s+$/.test(token) || /^[\.\-\_]+$/.test(token)) {
        return token;
      }

      // Check single character initial (e.g., S., K., M.)
      if (token.length === 1 && INITIALS[token.toUpperCase()]) {
        return INITIALS[token.toUpperCase()];
      }

      let t = token.toLowerCase();

      // Independent Vowels (Uyir Ezhuthukkal)
      const uyir = {
        'aai': 'ஆய்', 'aay': 'ஆய்', 'aau': 'ஆவ்', 'aaw': 'ஆவ்',
        'aa': 'ஆ', 'ee': 'ஈ', 'ii': 'ஈ', 'oo': 'ஊ', 'uu': 'ஊ',
        'ea': 'ஏ', 'ae': 'ஏ', 'ai': 'ஐ', 'ay': 'ஐ', 'ey': 'ஐ',
        'au': 'ஔ', 'ow': 'ஔ', 'ou': 'ஔ', 'oa': 'ஓ',
        'a': 'அ', 'i': 'இ', 'u': 'உ', 'e': 'எ', 'o': 'ஒ'
      };

      // Vowel Diacritics (Uyirmey Kurigal)
      const uyirmey = {
        'aai': 'ாய்', 'aay': 'ாய்', 'aau': 'ாவ்', 'aaw': 'ாவ்',
        'aa': 'ா', 'ee': 'ீ', 'ii': 'ீ', 'oo': 'ூ', 'uu': 'ூ',
        'ea': 'ே', 'ae': 'ே', 'ai': 'ை', 'ay': 'ை', 'ey': 'ை',
        'au': 'ௌ', 'ow': 'ௌ', 'ou': 'ௌ', 'oa': 'ோ',
        'a': '', 'i': 'ி', 'u': 'ு', 'e': 'ெ', 'o': 'ொ'
      };

      // Consonants (Mey Ezhuthukkal base)
      const mey = {
        'ksh': 'க்ஷ', 'sh': 'ஷ', 'zh': 'ழ', 'zr': 'ழ', 'th': 'த', 'dh': 'த',
        'ch': 'ச', 'ng': 'ங', 'gn': 'ஞ', 'ny': 'ஞ', 'nj': 'ஞ',
        'kh': 'க', 'gh': 'க', 'bh': 'ப', 'ph': 'ப',
        'k': 'க', 'g': 'க', 'c': 'க', 's': 'ச', 'j': 'ஜ',
        't': 'ட', 'd': 'ட', 'n': 'ந', 'p': 'ப', 'b': 'ப', 'f': 'ப',
        'm': 'ம', 'y': 'ய', 'r': 'ர', 'l': 'ல', 'v': 'வ', 'w': 'வ', 'h': 'ஹ', 'z': 'ஸ'
      };

      // Phonetic stems & roots for natural name transliteration
      const stems = [
        [/^karthik/i, 'கார்த்திக்'],
        [/^karthi/i, 'கார்த்தி'],
        [/^karth/i, 'கார்த்த'],
        [/^suryakala/i, 'சூர்யகலா'],
        [/^surya/i, 'சூர்ய'],
        [/^suresh/i, 'சுரேஷ்'],
        [/^saravanan/i, 'சரவணன்'],
        [/^saravan/i, 'சரவண'],
        [/^gowshik/i, 'கௌசிக்'],
        [/^gowsik/i, 'கௌசிக்'],
        [/^gow/i, 'கௌ'],
        [/^murugan/i, 'முருகன்'],
        [/^muru/i, 'முரு'],
        [/^dinesh/i, 'தினேஷ்'],
        [/^ramesh/i, 'ரமேஷ்'],
        [/^selvam/i, 'செல்வம்'],
        [/^selv/i, 'செல்வ'],
        [/^senthil/i, 'செந்தில்'],
        [/^senth/i, 'செந்த'],
        [/^praveen/i, 'பிரவீன்'],
        [/^prashanth/i, 'பிரசாந்த்'],
        [/^anand/i, 'ஆனந்த்'],
        [/^anitha/i, 'அனிதா'],
        [/^priya/i, 'பிரியா'],
        [/^vijay/i, 'விஜய்'],
        [/^kumar/i, 'குமார்'],
        [/^mani/i, 'மணி'],
        [/^raja/i, 'ராஜா']
      ];

      let result = '';
      let i = 0;

      for (const [rgx, replacement] of stems) {
        const m = t.match(rgx);
        if (m) {
          result += replacement;
          i = m[0].length;
          break;
        }
      }

      while (i < t.length) {
        // Match multi-character consonant first
        let matchedMey = null;
        let meyLen = 0;

        for (const len of [3, 2, 1]) {
          const sub = t.substr(i, len);
          if (mey[sub]) {
            matchedMey = mey[sub];
            meyLen = len;
            break;
          }
        }

        if (matchedMey) {
          let baseMey = matchedMey;
          // Contextual 'n': word-start uses 'ந', middle/end uses 'ன' or 'ன்'
          if (baseMey === 'ந' && i > 0) {
            baseMey = 'ன';
          }

          i += meyLen;

          // Check if followed by vowel
          let matchedVowel = null;
          let vowelLen = 0;

          for (const vlen of [3, 2, 1]) {
            const vsub = t.substr(i, vlen);
            if (uyirmey[vsub] !== undefined) {
              matchedVowel = uyirmey[vsub];
              vowelLen = vlen;
              break;
            }
          }

          if (matchedVowel !== null) {
            result += baseMey + matchedVowel;
            i += vowelLen;
          } else {
            // Pure consonant with pulli
            if (baseMey === 'ன' && i >= t.length) {
              result += 'ன்';
            } else {
              result += baseMey + '\u0BCD';
            }
          }
        } else {
          // Independent vowel at syllable start
          let matchedUyir = null;
          let uyirLen = 0;
          for (const ulen of [3, 2, 1]) {
            const usub = t.substr(i, ulen);
            if (uyir[usub]) {
              matchedUyir = uyir[usub];
              uyirLen = ulen;
              break;
            }
          }

          if (matchedUyir) {
            result += matchedUyir;
            i += uyirLen;
          } else {
            result += t[i];
            i++;
          }
        }
      }

      return result;
    }).join('');
  },

  init() {
    const saved = localStorage.getItem('aavin_lang');
    if (saved && (saved === 'ta' || saved === 'en')) {
      this.currentLang = saved;
    }
    document.documentElement.lang = this.currentLang;
  }
};

window.transliterateEnToTa = function (text) {
  return window.I18N ? window.I18N.transliterateEnToTa(text) : text;
};

window.I18N.init();
