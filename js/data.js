/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Authoritative 1 District = 1 Main Dairy = 1 Aavin Thozhilar Sangam Model
 */

window.AAVIN_DATA = {
  currentMember: {
    id: 'usr-mdu-0841',
    name_en: 'S. Saravanan',
    name_ta: 'S. சரவணன்',
    father_name: 'Marimuthu',
    memberId: 'TN-MDU-2026-8841',
    mobile: '98421 76540',
    districtCode: 'MDU',
    districtName_en: 'Madurai District',
    districtName_ta: 'மதுரை மாவட்டம்',
    sangamId: 'sgm-mdu',
    sangamName_en: 'Aavin Madurai Thozhilar Sangam',
    sangamName_ta: 'ஆவின் மதுரை தொழிலாளர் சங்கம்',
    dairyId: 'dairy-mdu-001',
    dairyName_en: 'Aavin Madurai Main Dairy',
    dairyName_ta: 'ஆவின் மதுரை முதன்மை பால் பண்ணை',
    sangamRegNo: 'TN-MDU-TS-8841',
    validUntil: '31/12/2028',
    cattleCount: 6,
    dailySupplyAvg: '48 Litres',
    bankVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },

  districts: [
    {
      code: 'MDU',
      name_en: 'Madurai',
      name_ta: 'மதுரை',
      dairyId: 'dairy-mdu-001',
      dairyName_en: 'Aavin Madurai Main Dairy',
      sangamId: 'sgm-mdu',
      sangamName_en: 'Aavin Madurai Thozhilar Sangam',
      hq: 'Aavin Complex, Sathamangalam, Madurai - 625020',
      phone: '0452-2531234',
      email: 'gm.maduraiaavin@tn.gov.in',
      memberCount: 28450,
      openIssues: 18,
      resolvedIssues: 114
    },
    {
      code: 'CBE',
      name_en: 'Coimbatore',
      name_ta: 'கோயம்புத்தூர்',
      dairyId: 'dairy-cbe-001',
      dairyName_en: 'Aavin Coimbatore Main Dairy',
      sangamId: 'sgm-cbe',
      sangamName_en: 'Aavin Coimbatore Thozhilar Sangam',
      hq: 'Dairy Complex, Pachapalayam, Coimbatore - 641010',
      phone: '0422-2645678',
      email: 'gm.cbeaavin@tn.gov.in',
      memberCount: 34200,
      openIssues: 14,
      resolvedIssues: 156
    },
    {
      code: 'SLM',
      name_en: 'Salem',
      name_ta: 'சேலம்',
      dairyId: 'dairy-slm-001',
      dairyName_en: 'Aavin Salem Main Dairy',
      sangamId: 'sgm-slm',
      sangamName_en: 'Aavin Salem Thozhilar Sangam',
      hq: 'Salem Dairy Complex, Sithanur, Salem - 636302',
      phone: '0427-2448201',
      email: 'gm.salemaavin@tn.gov.in',
      memberCount: 42100,
      openIssues: 22,
      resolvedIssues: 180
    },
    {
      code: 'ERD',
      name_en: 'Erode',
      name_ta: 'ஈரோடு',
      dairyId: 'dairy-erd-001',
      dairyName_en: 'Aavin Erode Main Dairy',
      sangamId: 'sgm-erd',
      sangamName_en: 'Aavin Erode Thozhilar Sangam',
      hq: 'Vasavi College Post, Chithode, Erode - 638316',
      phone: '0424-2533541',
      email: 'gm.erodeaavin@tn.gov.in',
      memberCount: 31800,
      openIssues: 11,
      resolvedIssues: 142
    },
    {
      code: 'TRY',
      name_en: 'Tiruchirappalli',
      name_ta: 'திருச்சிராப்பள்ளி',
      dairyId: 'dairy-try-001',
      dairyName_en: 'Aavin Tiruchirappalli Main Dairy',
      sangamId: 'sgm-try',
      sangamName_en: 'Aavin Tiruchirappalli Thozhilar Sangam',
      hq: 'Kottapattu, Pudukkottai Road, Trichy - 620023',
      phone: '0431-2331450',
      email: 'gm.trichyaavin@tn.gov.in',
      memberCount: 26100,
      openIssues: 9,
      resolvedIssues: 98
    }
  ],

  sangams: [
    {
      id: 'sgm-mdu',
      districtCode: 'MDU',
      districtName_en: 'Madurai',
      regNo: 'TN-MDU-TS-8841',
      name_en: 'Aavin Madurai Thozhilar Sangam',
      name_ta: 'ஆவின் மதுரை தொழிலாளர் சங்கம்',
      dairyId: 'dairy-mdu-001',
      dairyName_en: 'Aavin Madurai Main Dairy',
      dairyName_ta: 'ஆவின் மதுரை முதன்மை பால் பண்ணை',
      address: 'Aavin Dairy Complex, Sathamangalam, Madurai - 625020',
      president_en: 'Thiru K. Muthupandi',
      president_ta: 'திரு. கே. முத்துப்பாண்டி',
      secretary_en: 'Thiru S. Palanivel',
      secretary_ta: 'திரு. எஸ். பழனிவேல்',
      treasurer_en: 'Thirumathi M. Meenakshi',
      treasurer_ta: 'திருமதி. மு. மீனாட்சி',
      phone: '+91 98421 88410',
      activeMembers: 2840,
      verified: true
    }
  ],

  issues: [
    {
      id: 'MDU-ISSUE-1042',
      reporterId: 'usr-mdu-0841',
      reporterName: 'M. Saravanan (மு. சரவணன்)',
      districtCode: 'MDU',
      sangamId: 'sgm-mdu',
      sangamName_en: 'Aavin Madurai Thozhilar Sangam',
      category: 'catChillingPlant',
      categoryName_en: 'Main Dairy Pasteurization & Chilling Line',
      categoryName_ta: 'முதன்மை பால் பண்ணை பதப்படுத்தும் பிரிவு',
      title_en: 'Madurai Main Dairy Processing Unit 2 Chilling Line Compressor Coil Service Needed',
      title_ta: 'மதுரை முதன்மை பால் பண்ணை யூனிட் 2 சிலிங் லைன் கம்ப்ரசர் பழுது நீக்கம் தேவை',
      description: 'The main pasteurization chilling line unit 2 compressor experienced phase voltage fluctuation. Routine maintenance and replacement coil requested to ensure uninterrupted 24/7 milk packaging schedule.',
      location: 'Aavin Madurai Main Dairy, Sathamangalam',
      relatedReportsCount: 14,
      calculatedPriority: 'high',
      finalPriority: 'high',
      isAdminVerified: true,
      verifiedBy: 'Sangam Secretary (Thiru S. Palanivel)',
      verifiedAt: '10/09/2026, 08:15 AM',
      forwardedToDept: 'TANGEDCO / TNEB Power & Dairy Engineering Division',
      forwardedAt: '10/09/2026, 09:30 AM',
      status: 'forwarded',
      createdAt: '10/09/2026, 07:10 AM',
      history: [
        { status: 'submitted', date: '10/09/2026 07:10 AM', actor: 'Member M. Saravanan', note: 'Issue submitted with photo note' },
        { status: 'admin_verification', date: '10/09/2026 08:00 AM', actor: 'Sangam Admin S. Palanivel', note: 'Verified with Plant Engineering section.' },
        { status: 'verified', date: '10/09/2026 08:15 AM', actor: 'Sangam Admin S. Palanivel', note: 'Priority marked HIGH (🟡)' },
        { status: 'forwarded', date: '10/09/2026 09:30 AM', actor: 'District Milk Officer, Madurai', note: 'Forwarded to Dairy Engineering Division. Technical crew assigned.' }
      ]
    }
  ],

  meetings: [
    {
      id: 'mtg-mdu-401',
      title_en: 'Aavin Madurai Thozhilar Sangam Council & Plant Operations Review',
      title_ta: 'ஆவின் மதுரை தொழிலாளர் சங்க ஆலோசனை & ஆலை செயல்பாடுகள் ஆய்வுக் கூட்டம்',
      districtCode: 'MDU',
      sangamId: 'sgm-mdu',
      organizer: 'Thiru S. Palanivel (Secretary, Aavin Madurai Thozhilar Sangam)',
      scheduledTime: 'Today • 04:30 PM - 05:30 PM',
      isLive: true,
      attendeesCount: 52,
      agenda: [
        'Review of Main Dairy plant refrigeration backup power',
        'Distribution of safety equipment and uniform allowances',
        'Mandatory enrollment for Aavin Digital ID smart cards',
        'Grievance redressal regarding plant shift schedules'
      ]
    }
  ],

  pastRecordings: [
    {
      id: 'rec-mdu-392',
      title_en: 'Special General Council Meeting on Dairy Plant Modernization & Workers Welfare',
      title_ta: 'பால் பண்ணை நவீனமயமாக்கல் மற்றும் தொழிலாளர் நலன் குறித்த சிறப்பு பொதுக்குழு கூட்டம்',
      date: '02/09/2026',
      duration: '42 mins',
      organizer: 'General Manager, Madurai District Co-op Milk Producers Union',
      attendeeCount: 86,
      videoPlaceholderUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      summary: 'General Council passed 3 key resolutions on safety allowances and chilling equipment expansion.'
    }
  ],

  news: [
    {
      id: 'news-01',
      category: 'government_updates',
      title_en: 'TN Government Announces Special Milk Incentive of ₹3/Litre for Sangam Members',
      title_ta: 'கூட்டுறவு சங்க உறுப்பினர்களுக்கு லிட்டருக்கு ₹3 சிறப்பு ஊக்கத்தொகை - தமிழ்நாடு அரசு அரசாணை வெளியீடு',
      content_en: 'Hon’ble Chief Minister of Tamil Nadu has announced an additional incentive of ₹3 per litre for cow milk procured through dairy co-operative unions across Tamil Nadu. The incentive will be credited directly to members’ bank accounts via DBT from October 1, 2026.',
      content_ta: 'தமிழ்நாடு முழுவதும் கூட்டுறவு ஒன்றியங்கள் மூலம் கொள்முதல் செய்யப்படும் பசும்பாலுக்கு லிட்டருக்கு கூடுதலாக ₹3 ஊக்கத்தொகை வழங்கப்படும் என மாண்புமிகு தமிழ்நாடு முதலமைச்சர் அறிவித்துள்ளார்.',
      authority_en: 'Department of Dairy Development, Govt of Tamil Nadu',
      authority_ta: 'பால்வளத்துறை, தமிழ்நாடு அரசு',
      date: '10/09/2026',
      hasDoc: true,
      docName: 'G.O.(Ms).No.142_Dairy_Incentive_2026.pdf'
    },
    {
      id: 'news-02',
      category: 'aavin_updates',
      title_en: 'Madurai District Aavin Main Dairy Completes Fully Automated Packaging Expansion',
      title_ta: 'மதுரை மாவட்ட ஆவின் முதன்மை பால் பண்ணை தானியங்கி பேக்கிங் விரிவாக்கம் நிறைவு',
      content_en: 'The modernization and expansion of the high-speed pouch packing section at Madurai Main Dairy (Sathamangalam) has been completed.',
      content_ta: 'மதுரை சாத்தமங்கலம் ஆவின் முதன்மை பால் பண்ணையில் அதிவேக பால் பாக்கெட் தயாரிக்கும் நவீன பிரிவு பயன்பாட்டிற்கு வந்துள்ளது.',
      authority_en: 'Madurai District Co-operative Milk Producers Union Ltd.',
      authority_ta: 'மதுரை மாவட்ட கூட்டுறவு பால் உற்பத்தியாளர்கள் ஒன்றியம்',
      date: '08/09/2026',
      hasDoc: true,
      docName: 'Madurai_Main_Dairy_Expansion_Report.pdf'
    }
  ],

  notifications: [
    {
      id: 'notif-01',
      title_en: 'Priority Alert: Main Dairy Line Maintenance',
      title_ta: 'முன்னுரிமை எச்சரிக்கை: பால் பண்ணை பராமரிப்பு',
      body_en: 'Issue MDU-ISSUE-1042 verified and forwarded to Dairy Engineering division.',
      body_ta: 'புகார் MDU-ISSUE-1042 சரிபார்க்கப்பட்டு பொறியியல் பிரிவுக்கு அனுப்பப்பட்டது.',
      isPriority: true,
      time: '15 mins ago',
      read: false,
      targetTab: 'issues',
      targetParams: { action: 'track' }
    },
    {
      id: 'notif-02',
      title_en: 'Upcoming Meeting at 04:30 PM',
      title_ta: 'இன்று மாலை 04:30 மணிக்கு சங்க கூட்டம்',
      body_en: 'Aavin Madurai Thozhilar Sangam Council will start online. Tap to join live.',
      body_ta: 'ஆவின் மதுரை தொழிலாளர் சங்க கூட்டம் ஆன்லைனில் தொடங்குகிறது. இணைய தொடவும்.',
      isPriority: false,
      time: '1 hour ago',
      read: false,
      targetTab: 'meetings',
      targetParams: { view: 'live' }
    },
    {
      id: 'notif-03',
      title_en: 'New Govt Order (G.O. 142) Published',
      title_ta: 'புதிய அரசு ஆணை (GO 142) வெளியிடப்பட்டது',
      body_en: 'Special milk incentive of ₹3/litre credited directly via DBT scheme.',
      body_ta: 'பால் உற்பத்தியாளர்களுக்கு லிட்டருக்கு ₹3 கூடுதல் ஊக்கத்தொகை ஆணை.',
      isPriority: false,
      time: '2 hours ago',
      read: false,
      targetTab: 'news',
      targetParams: {}
    }
  ]
};
