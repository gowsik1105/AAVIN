/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Reactive Client State Store & Offline Sync Manager
 */

window.AAVIN_STORE = {
  state: {
    currentRole: 'member', // 'member' | 'sangam_admin' | 'district_admin' | 'state_admin'
    currentTab: 'home',
    selectedDistrict: 'MDU',
    selectedSangam: 'sgm-mdu',
    isOnline: navigator.onLine,
    issues: [],
    dairies: [],
    userCoords: null,
    notifications: [],
    activeMeeting: null,
    searchQuery: '',
    offlineDrafts: []
  },

  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  },

  init() {
    // 1. Check authenticated user session
    const savedUser = localStorage.getItem('aavin_user_session');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        window.AAVIN_DATA.currentMember = userObj;
        this.state.currentRole = userObj.role || 'member';
      } catch (e) {}
    }

    // 2. Load persisted issues or seed
    const savedIssues = localStorage.getItem('aavin_issues');
    if (savedIssues) {
      try {
        this.state.issues = JSON.parse(savedIssues);
      } catch (e) {
        this.state.issues = window.AAVIN_DATA.issues || [];
      }
    } else {
      this.state.issues = window.AAVIN_DATA.issues || [];
      this.persistIssues();
    }

    // 3. Load notifications with persistent read states
    const savedNotifs = localStorage.getItem('aavin_notifications');
    if (savedNotifs) {
      try {
        this.state.notifications = JSON.parse(savedNotifs);
      } catch (e) {
        this.state.notifications = window.AAVIN_DATA.notifications || [];
      }
    } else {
      this.state.notifications = window.AAVIN_DATA.notifications || [];
      this.persistNotifications();
    }

    // 4. Load persisted role
    const savedRole = localStorage.getItem('aavin_role');
    if (savedRole) {
      this.state.currentRole = savedRole;
    }

    // 5. Network listeners
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      const netBadge = document.getElementById('globalNetworkBadge');
      if (netBadge) {
        netBadge.className = 'network-status-badge online';
        const netText = document.getElementById('networkText');
        if (netText) netText.textContent = 'Live Network';
      }
      this.notify();
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      const netBadge = document.getElementById('globalNetworkBadge');
      if (netBadge) {
        netBadge.className = 'network-status-badge';
        const netText = document.getElementById('networkText');
        if (netText) netText.textContent = 'Offline Mode';
      }
      this.notify();
    });
  },

  setRole(role) {
    this.state.currentRole = role;
    localStorage.setItem('aavin_role', role);
    this.notify();
  },

  setTab(tab) {
    this.state.currentTab = tab;
    this.notify();
  },

  addIssue(newIssue) {
    this.state.issues.unshift(newIssue);
    this.persistIssues();

    // Add a notification for the newly reported issue
    const newNotif = {
      id: 'notif-' + Date.now(),
      title_en: `Issue ${newIssue.id} Submitted`,
      title_ta: `புகார் ${newIssue.id} பதிவு செய்யப்பட்டது`,
      body_en: `Your grievance regarding ${newIssue.categoryName_en || 'Dairy Operations'} has been received.`,
      body_ta: `உங்கள் புகார் பெறப்பட்டு ஆய்வுக்கு அனுப்பப்பட்டுள்ளது.`,
      isPriority: newIssue.calculatedPriority === 'critical',
      time: 'Just now',
      read: false,
      targetTab: 'issues',
      targetParams: { action: 'track' }
    };
    this.state.notifications.unshift(newNotif);
    this.persistNotifications();
    this.notify();
  },

  verifyIssue(issueId, priority = 'high') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.isAdminVerified = true;
      target.finalPriority = priority;
      target.status = 'verified';
      target.verifiedBy = 'Sangam Secretary';
      target.verifiedAt = new Date().toLocaleTimeString();
      this.persistIssues();
      this.notify();
    }
  },

  forwardIssue(issueId, targetDept) {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'forwarded';
      target.forwardedToDept = targetDept;
      target.forwardedAt = new Date().toLocaleTimeString();
      this.persistIssues();
      this.notify();
    }
  },

  resolveIssue(issueId, note = 'Resolution completed by Technical Wing') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'resolved';
      target.resolvedAt = new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'resolved',
        date: new Date().toLocaleDateString('en-GB'),
        actor: 'District Technical Wing',
        note: note
      });
      this.persistIssues();
      this.notify();
    }
  },

  persistIssues() {
    try {
      localStorage.setItem('aavin_issues', JSON.stringify(this.state.issues));
    } catch (e) {}
  },

  persistNotifications() {
    try {
      localStorage.setItem('aavin_notifications', JSON.stringify(this.state.notifications));
    } catch (e) {}
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.AAVIN_STORE.init();
});
