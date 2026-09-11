/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Strict Role-Based Access Control (RBAC) & Protected Navigation Manager
 * 
 * Exact 3 Admin Roles:
 * 1. tamil_nadu_admin -> Overall State & Main Dairy Management
 * 2. district_admin   -> District-specific Operations & Escalations
 * 3. sangam_admin     -> Local Primary Cooperative Sangam Administration
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
    sangam_admin: {
      id: 'sangam_admin',
      labelKey: 'role_sangam_admin',
      name_en: 'Sangam Admin',
      name_ta: 'சங்க நிர்வாகி',
      badgeColor: '#0b4f8a',
      allowedTabs: ['admin_sangam', 'issues', 'meetings', 'news', 'map', 'digital_id', 'settings', 'terms', 'privacy', 'help', 'more']
    },
    district_admin: {
      id: 'district_admin',
      labelKey: 'role_district_admin',
      name_en: 'District Admin',
      name_ta: 'மாவட்ட நிர்வாகி',
      badgeColor: '#ea580c',
      allowedTabs: ['admin_district', 'heatmap', 'analytics', 'issues', 'meetings', 'news', 'map', 'settings', 'terms', 'privacy', 'more']
    },
    tamil_nadu_admin: {
      id: 'tamil_nadu_admin',
      labelKey: 'role_state_admin',
      name_en: 'Tamil Nadu Admin',
      name_ta: 'மாநில அரசு நிர்வாகி',
      badgeColor: '#7c3aed',
      allowedTabs: ['admin_state', 'heatmap', 'analytics', 'issues', 'news', 'meetings', 'map', 'settings', 'terms', 'privacy', 'more']
    },
    state_admin: {
      id: 'tamil_nadu_admin',
      labelKey: 'role_state_admin',
      name_en: 'Tamil Nadu Admin',
      name_ta: 'மாநில அரசு நிர்வாகி',
      badgeColor: '#7c3aed',
      allowedTabs: ['admin_state', 'heatmap', 'analytics', 'issues', 'news', 'meetings', 'map', 'settings', 'terms', 'privacy', 'more']
    }
  },

  canAccess(role, tab) {
    const config = this.roles[role];
    if (!config) return false;
    return config.allowedTabs.includes(tab);
  },

  isAdmin(role) {
    return role === 'tamil_nadu_admin' || role === 'district_admin' || role === 'sangam_admin' || role === 'state_admin';
  },

  getCurrentRoleConfig() {
    const role = window.AAVIN_STORE.state.currentRole;
    return this.roles[role] || this.roles.member;
  }
};
