/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Strict Role-Based Access Control (RBAC) & Protected Navigation Manager
 * 
 * Roles Supported:
 * - admin / tamil_nadu_admin / state_admin -> Full State Oversight & User Management
 * - district_admin                         -> District Operations & Grievances
 * - sangam_admin                           -> Primary Village Cooperative Administration
 * - user / member                          -> Standard Cooperative Member
 */

window.AAVIN_RBAC = {
  roles: {
    member: {
      id: 'member',
      labelKey: 'role_member',
      name_en: 'Verified Member',
      name_ta: 'உறுப்பினர்',
      badgeColor: '#15803d',
      allowedTabs: ['home', 'news', 'meetings', 'issues', 'digital_id', 'map', 'help', 'settings', 'terms', 'privacy', 'more', 'sangam_profile']
    },
    user: {
      id: 'user',
      labelKey: 'role_member',
      name_en: 'Verified Member',
      name_ta: 'உறுப்பினர்',
      badgeColor: '#15803d',
      allowedTabs: ['home', 'news', 'meetings', 'issues', 'digital_id', 'map', 'help', 'settings', 'terms', 'privacy', 'more', 'sangam_profile']
    },
    admin: {
      id: 'admin',
      labelKey: 'role_state_admin',
      name_en: 'System Administrator',
      name_ta: 'அமைப்பு நிர்வாகி',
      badgeColor: '#7c3aed',
      allowedTabs: ['admin_state', 'admin_users', 'heatmap', 'analytics', 'issues', 'news', 'meetings', 'map', 'settings', 'terms', 'privacy', 'more']
    },
    sangam_admin: {
      id: 'sangam_admin',
      labelKey: 'role_sangam_admin',
      name_en: 'Sangam Admin',
      name_ta: 'சங்க நிர்வாகி',
      badgeColor: '#0b4f8a',
      allowedTabs: ['admin_sangam', 'admin_users', 'issues', 'meetings', 'news', 'map', 'digital_id', 'settings', 'terms', 'privacy', 'help', 'more']
    },
    district_admin: {
      id: 'district_admin',
      labelKey: 'role_district_admin',
      name_en: 'District Admin',
      name_ta: 'மாவட்ட நிர்வாகி',
      badgeColor: '#ea580c',
      allowedTabs: ['admin_district', 'admin_users', 'heatmap', 'analytics', 'issues', 'meetings', 'news', 'map', 'settings', 'terms', 'privacy', 'more']
    },
    tamil_nadu_admin: {
      id: 'tamil_nadu_admin',
      labelKey: 'role_state_admin',
      name_en: 'Tamil Nadu Admin',
      name_ta: 'மாநில அரசு நிர்வாகி',
      badgeColor: '#7c3aed',
      allowedTabs: ['admin_state', 'admin_users', 'heatmap', 'analytics', 'issues', 'news', 'meetings', 'map', 'settings', 'terms', 'privacy', 'more']
    },
    state_admin: {
      id: 'tamil_nadu_admin',
      labelKey: 'role_state_admin',
      name_en: 'Tamil Nadu Admin',
      name_ta: 'மாநில அரசு நிர்வாகி',
      badgeColor: '#7c3aed',
      allowedTabs: ['admin_state', 'admin_users', 'heatmap', 'analytics', 'issues', 'news', 'meetings', 'map', 'settings', 'terms', 'privacy', 'more']
    }
  },

  canAccess(role, tab) {
    // Admin-only tabs
    const adminOnlyTabs = ['admin_state', 'admin_district', 'admin_sangam', 'admin_users', 'analytics', 'heatmap'];
    if (adminOnlyTabs.includes(tab)) {
      return this.isAdmin(role);
    }

    const config = this.roles[role] || this.roles.member;
    return config.allowedTabs.includes(tab);
  },

  isAdmin(role) {
    if (!role) return false;
    const cleanRole = String(role).toLowerCase().trim();
    return ['admin', 'tamil_nadu_admin', 'state_admin', 'district_admin', 'sangam_admin'].includes(cleanRole);
  },

  getCurrentRoleConfig() {
    const role = window.AAVIN_STORE ? window.AAVIN_STORE.state.currentRole : 'member';
    return this.roles[role] || this.roles.member;
  }
};
