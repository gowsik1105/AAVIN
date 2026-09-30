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
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const newNotif = {
      id: 'notif-' + Date.now(),
      title_en: `Issue ${newIssue.id} Submitted`,
      title_ta: `புகார் ${newIssue.id} பதிவு செய்யப்பட்டது`,
      body_en: `Your grievance regarding "${newIssue.title_en || newIssue.categoryName_en}" has been received and logged.`,
      body_ta: `உங்கள் புகார் "${newIssue.title_ta || newIssue.categoryName_ta}" பெறப்பட்டு ஆய்வுக்கு அனுப்பப்பட்டுள்ளது.`,
      isPriority: newIssue.calculatedPriority === 'urgent' || newIssue.calculatedPriority === 'critical',
      time: 'Just now',
      read: false,
      targetTab: 'issues',
      targetParams: { action: 'track' }
    };
    this.state.notifications.unshift(newNotif);
    this.persistNotifications();
    this.notify();

    // Attempt Supabase Database synchronization asynchronously
    if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.submitIssueToDatabase === 'function') {
      window.AAVIN_SUPABASE_AUTH.submitIssueToDatabase(newIssue);
    }
  },

  updateIssueStatus(issueId, status, note = '', actor = '') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB');
      if (!target.history) target.history = [];
      target.history.push({
        status: status,
        date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: actor || 'Sangam Administration',
        note: note || `Status updated to ${status}`
      });
      this.persistIssues();
      this.notify();

      if (window.AAVIN_SUPABASE_AUTH && typeof window.AAVIN_SUPABASE_AUTH.updateIssueStatusInDatabase === 'function') {
        window.AAVIN_SUPABASE_AUTH.updateIssueStatusInDatabase(issueId, status, note);
      }
    }
  },

  verifyIssue(issueId, priority = 'urgent') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.isAdminVerified = true;
      target.finalPriority = priority;
      target.status = 'under_review';
      target.verifiedBy = 'Sangam Secretary';
      target.verifiedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'under_review',
        date: 'Just now',
        actor: 'Sangam Secretary',
        note: 'Issue verified and marked Under Review'
      });
      this.persistIssues();
      this.notify();
    }
  },

  assignIssue(issueId, assignee = 'District Field Officer') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'assigned';
      target.assignedTo = assignee;
      target.assignedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'assigned',
        date: 'Just now',
        actor: 'Sangam Admin',
        note: `Assigned to ${assignee}`
      });
      this.persistIssues();
      this.notify();
    }
  },

  progressIssue(issueId, note = 'Field inspection and corrective action in progress') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'in_progress';
      if (!target.history) target.history = [];
      target.history.push({
        status: 'in_progress',
        date: 'Just now',
        actor: 'Field Operations',
        note: note
      });
      this.persistIssues();
      this.notify();
    }
  },

  forwardIssue(issueId, targetDept) {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'in_progress';
      target.forwardedToDept = targetDept;
      target.forwardedAt = new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'in_progress',
        date: 'Just now',
        actor: 'District Officer',
        note: `Forwarded to Department: ${targetDept}`
      });
      this.persistIssues();
      this.notify();
    }
  },

  resolveIssue(issueId, note = 'Resolution completed by Technical Wing') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'resolved';
      target.resolvedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'resolved',
        date: new Date().toLocaleDateString('en-GB'),
        actor: 'Sangam / District Officer',
        note: note
      });
      this.persistIssues();
      this.notify();
    }
  },

  closeIssue(issueId, note = 'Grievance confirmed resolved and closed by member/admin') {
    const target = this.state.issues.find(i => i.id === issueId);
    if (target) {
      target.status = 'closed';
      target.closedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString();
      if (!target.history) target.history = [];
      target.history.push({
        status: 'closed',
        date: new Date().toLocaleDateString('en-GB'),
        actor: 'Administration',
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
