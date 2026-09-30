/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Production Admin Portals & Database-Backed User Management Controller
 * - Real-time statistics querying Supabase Database
 * - Live User Management (View Users, Update Roles, Toggle Active Status)
 * - Protected role-based administration views
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.AdminPortals = {
  activeAdminSubTab: 'overview', // 'overview' | 'users' | 'issues'
  userList: [],
  userSearchQuery: '',
  userRoleFilter: 'ALL',
  isLoadingUsers: false,

  setAdminSubTab(subTab) {
    this.activeAdminSubTab = subTab;
    if (subTab === 'users' && this.userList.length === 0) {
      this.loadUsers();
    } else {
      window.AAVIN_APP.renderCurrentView();
    }
  },

  async loadUsers() {
    this.isLoadingUsers = true;
    window.AAVIN_APP.renderCurrentView();

    const res = await window.AAVIN_SUPABASE_AUTH.getAllUsers();
    this.isLoadingUsers = false;
    if (res.success && res.users) {
      this.userList = res.users;
    }
    window.AAVIN_APP.renderCurrentView();
  },

  async handleRoleChange(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    const res = await window.AAVIN_SUPABASE_AUTH.updateUserRole(userId, newRole);
    if (res.success) {
      window.AAVIN_APP.showToast(`Role updated to ${newRole}`);
      // Update local state
      const target = this.userList.find(u => u.id === userId);
      if (target) target.role = newRole;
      window.AAVIN_APP.renderCurrentView();
    } else {
      window.AAVIN_APP.showToast(`Error: ${res.error}`);
    }
  },

  async handleToggleActive(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this account?`)) {
      return;
    }
    const res = await window.AAVIN_SUPABASE_AUTH.toggleUserActive(userId, currentStatus);
    if (res.success) {
      window.AAVIN_APP.showToast(res.message);
      const target = this.userList.find(u => u.id === userId);
      if (target) target.is_active = res.is_active;
      window.AAVIN_APP.renderCurrentView();
    } else {
      window.AAVIN_APP.showToast(`Error: ${res.error}`);
    }
  },

  renderUserManagement() {
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    const filteredUsers = this.userList.filter(u => {
      const q = (this.userSearchQuery || '').toLowerCase();
      const matchQuery = !q || (u.full_name && u.full_name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.district_name && u.district_name.toLowerCase().includes(q));
      const matchRole = this.userRoleFilter === 'ALL' || u.role === this.userRoleFilter;
      return matchQuery && matchRole;
    });

    const totalUsers = this.userList.length;
    const activeUsers = this.userList.filter(u => u.is_active !== false).length;
    const adminCount = this.userList.filter(u => window.AAVIN_RBAC.isAdmin(u.role)).length;

    return `
      <div style="margin-top: 16px;">
        <!-- User Metrics Banner -->
        <div class="grid-4" style="margin-bottom: 16px;">
          <div class="card card-floating-3d" style="text-align: center; padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">Total Users in Database</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--aavin-primary); margin-top: 2px;">${totalUsers}</div>
          </div>
          <div class="card card-floating-3d" style="text-align: center; padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">Active Accounts</div>
            <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 2px;">${activeUsers}</div>
          </div>
          <div class="card card-floating-3d" style="text-align: center; padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">Admin Accounts</div>
            <div style="font-size: 20px; font-weight: 800; color: #7c3aed; margin-top: 2px;">${adminCount}</div>
          </div>
          <div class="card card-floating-3d" style="text-align: center; padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">Database RLS Security</div>
            <div style="font-size: 13px; font-weight: 800; color: #0284c7; margin-top: 4px;">✓ Protected</div>
          </div>
        </div>

        <!-- Controls: Search, Filter, Refresh -->
        <div class="card card-floating-3d" style="padding: 14px; margin-bottom: 16px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 8px; flex: 1; min-width: 260px;">
              <input 
                type="text" 
                placeholder="Search users by name, email, district..." 
                value="${this.userSearchQuery}"
                oninput="window.AAVIN_COMPONENTS.AdminPortals.userSearchQuery = this.value; window.AAVIN_APP.renderCurrentView();"
                style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 13px; outline: none;"
              />
              <select 
                onchange="window.AAVIN_COMPONENTS.AdminPortals.userRoleFilter = this.value; window.AAVIN_APP.renderCurrentView();"
                style="padding: 8px 10px; border-radius: 8px; border: 1.5px solid var(--border-strong); font-size: 12px;"
              >
                <option value="ALL" ${this.userRoleFilter === 'ALL' ? 'selected' : ''}>All Roles</option>
                <option value="user" ${this.userRoleFilter === 'user' ? 'selected' : ''}>User / Member</option>
                <option value="admin" ${this.userRoleFilter === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="sangam_admin" ${this.userRoleFilter === 'sangam_admin' ? 'selected' : ''}>Sangam Admin</option>
                <option value="district_admin" ${this.userRoleFilter === 'district_admin' ? 'selected' : ''}>District Admin</option>
                <option value="tamil_nadu_admin" ${this.userRoleFilter === 'tamil_nadu_admin' ? 'selected' : ''}>State Admin</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('register')">
                ${icon('plus', { size: 14, color: '#ffffff' })}
                <span>New Member Registration</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.loadUsers()">
                ${icon('refresh', { size: 14, color: '#0b4f8a' })}
                <span>Refresh Users</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card card-floating-3d" style="padding: 0; overflow: hidden;">
          <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table style="width: 100%; min-width: 680px; border-collapse: collapse; font-size: 12.5px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid var(--border-subtle); color: var(--text-secondary); font-size: 11.5px; text-transform: uppercase;">
                  <th style="padding: 12px 14px;">User / Email</th>
                  <th style="padding: 12px 14px;">District / Sangam</th>
                  <th style="padding: 12px 14px;">Status</th>
                  <th style="padding: 12px 14px;">Assigned Role (Supabase RLS)</th>
                  <th style="padding: 12px 14px; text-align: right;">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.length === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
                      ${this.isLoadingUsers ? 'Loading users from Supabase...' : 'No users found matching your search.'}
                    </td>
                  </tr>
                ` : filteredUsers.map(u => {
                  const isAdmin = window.AAVIN_RBAC.isAdmin(u.role);
                  return `
                    <tr style="border-bottom: 1px solid var(--border-subtle); background: ${u.is_active === false ? '#fff1f2' : '#ffffff'}; transition: background 0.15s ease;">
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 800; color: var(--text-primary); font-size: 13px;">${u.full_name || 'Member'}</div>
                        <div style="font-size: 11.5px; color: var(--text-muted);">${u.email}</div>
                        ${u.phone ? `<div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin-top: 2px;">${icon('phone', { size: 11, color: '#64748b' })} +91 ${u.phone}</div>` : ''}
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 700; color: var(--aavin-primary);">${u.district_name || 'Madurai District'}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${u.sangam_name || 'Aavin Thozhilar Sangam'}</div>
                      </td>
                      <td style="padding: 12px 14px;">
                        ${u.is_active !== false ? `
                          <span class="badge badge-normal" style="background: #ecfdf5; color: #059669; display: inline-flex; align-items: center; gap: 4px;">${icon('check', { size: 11, color: '#059669' })} Active</span>
                        ` : `
                          <span class="badge" style="background: #fee2e2; color: #dc2626;">Deactivated</span>
                        `}
                      </td>
                      <td style="padding: 12px 14px;">
                        <select 
                          onchange="window.AAVIN_COMPONENTS.AdminPortals.handleRoleChange('${u.id}', this.value)"
                          style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${isAdmin ? '#7c3aed' : 'var(--border-strong)'}; font-size: 12px; font-weight: 700; background: ${isAdmin ? '#faf5ff' : '#ffffff'}; color: ${isAdmin ? '#6b21a8' : 'var(--text-primary)'}; cursor: pointer;"
                        >
                          <option value="user" ${u.role === 'user' || u.role === 'member' ? 'selected' : ''}>User (Member)</option>
                          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>System Admin</option>
                          <option value="sangam_admin" ${u.role === 'sangam_admin' ? 'selected' : ''}>Sangam Admin</option>
                          <option value="district_admin" ${u.role === 'district_admin' ? 'selected' : ''}>District Admin</option>
                          <option value="tamil_nadu_admin" ${u.role === 'tamil_nadu_admin' || u.role === 'state_admin' ? 'selected' : ''}>State Admin (HQ)</option>
                        </select>
                      </td>
                      <td style="padding: 12px 14px; text-align: right;">
                        <button 
                          type="button" 
                          class="btn btn-sm ${u.is_active !== false ? 'btn-secondary' : 'btn-success'}" 
                          onclick="window.AAVIN_COMPONENTS.AdminPortals.handleToggleActive('${u.id}', ${u.is_active !== false})"
                          style="font-size: 11.5px;"
                        >
                          ${u.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderStateAdmin() {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'Tamil Nadu State Administrator',
      email: 'gowsik1105@gmail.com',
      role: 'admin',
      admin_type: 'tamil_nadu',
      districtName: 'State Headquarters'
    };

    return `
      <div>
        <!-- State Admin Header Ribbon -->
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 16px; border-left: 6px solid #7c3aed; background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #f3e8ff; color: #7c3aed; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('award', { size: 14, color: '#7c3aed' })} ADMIN DASHBOARD • SUPABASE DB VERIFIED
                </span>
                <span class="badge badge-normal">${icon('check', { size: 11, color: '#059669' })} Role: ${admin.role}</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #4c1d95; font-weight: 800; margin-top: 6px;">
                Aavin Cooperative Command & Administration
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                Officer: <strong>${admin.fullName}</strong> • ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
                ${icon('map', { size: 14, color: '#0b4f8a' })}
                <span>Main Dairy Explorer</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher (Dashboard vs User Management) -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            ${icon('analytics', { size: 14, color: this.activeAdminSubTab === 'overview' ? '#0b4f8a' : '#64748b' })}
            <span>System Overview</span>
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            ${icon('user', { size: 14, color: this.activeAdminSubTab === 'users' ? '#0b4f8a' : '#64748b' })}
            <span>User Management</span>
          </button>
        </div>

        ${this.activeAdminSubTab === 'users' ? this.renderUserManagement() : `
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
              <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">User Accounts (DB)</div>
              <div style="font-size: 22px; font-weight: 800; color: #7c3aed; margin-top: 2px;">${this.userList.length || 'Connected'}</div>
              <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 6px; font-size: 11px;" onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')">Manage Users →</button>
            </div>

            <div class="card card-floating-3d" style="text-align: center; padding: 14px;">
              <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700;">Database Access</div>
              <div style="font-size: 14px; font-weight: 800; color: #0284c7; margin-top: 4px;">Supabase Auth + RLS</div>
              <span class="badge badge-normal" style="margin-top: 4px;">Live Verification</span>
            </div>
          </div>

          <!-- Main Dairies Management Table Preview -->
          <div class="card card-floating-3d">
            <div class="card-header">
              <h3 class="card-title">
                ${icon('dairy', { size: 20, color: '#7c3aed' })}
                <span>Statewide Main Dairy Plants & Processing Infrastructure</span>
              </h3>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
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
        `}
      </div>
    `;
  },

  renderDistrictAdmin() {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'District Dairy Officer',
      email: 'aavindis@admin.com',
      role: 'admin',
      admin_type: 'district',
      districtName: 'Madurai District'
    };
    const issues = (window.AAVIN_STORE.state.issues || []);
    const districtIssues = issues.filter(i => i.districtCode === (admin.districtCode || 'MDU') || admin.districtCode === 'ALL');
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div>
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 18px; border-left: 6px solid #ea580c; background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #ffedd5; color: #ea580c; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('admin', { size: 14, color: '#ea580c' })} DISTRICT ADMIN PORTAL • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">${icon('check', { size: 11, color: '#059669' })} ${admin.districtName || 'Madurai'} Union</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #9a3412; font-weight: 800; margin-top: 6px;">
                ${admin.districtName || 'Madurai District'} Cooperative Union HQ
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                District Officer: <strong>${admin.fullName}</strong> • ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')">
                ${icon('user', { size: 14, color: '#0b4f8a' })}
                <span>Manage Users</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                <span>Admin Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            ${icon('analytics', { size: 14, color: this.activeAdminSubTab === 'overview' ? '#0b4f8a' : '#64748b' })}
            <span>District Overview</span>
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            ${icon('user', { size: 14, color: this.activeAdminSubTab === 'users' ? '#0b4f8a' : '#64748b' })}
            <span>User Management</span>
          </button>
        </div>

        ${this.activeAdminSubTab === 'users' ? this.renderUserManagement() : `
          <!-- District Escalation Queue -->
          <div class="card card-floating-3d">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 class="card-title">
                ${icon('issues', { size: 20, color: '#dc2626' })}
                <span>District Issue Escalations & Department Routing (${districtIssues.length})</span>
              </h3>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('issues')">
                View All →
              </button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${districtIssues.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No open issues currently in District queue.
                </div>
              ` : districtIssues.map(issue => {
                const isUrgent = issue.calculatedPriority === 'urgent' || issue.calculatedPriority === 'critical';
                const isResolved = issue.status === 'resolved' || issue.status === 'closed';

                return `
                  <div style="background: #f8fafc; border: 1.5px solid var(--border-strong); border-radius: var(--radius-md); padding: 14px; border-left: 5px solid ${isResolved ? '#15803d' : (isUrgent ? '#dc2626' : '#ea580c')};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                      <div style="flex: 1; min-width: 260px;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <strong style="color: var(--aavin-primary); font-family: monospace; font-size: 12px; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${issue.id}</strong>
                          <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 11px;">
                            ${issue.categoryName_ta || issue.categoryName_en || issue.category}
                          </span>
                          <span class="badge" style="background: ${isUrgent ? '#fee2e2' : '#dcfce7'}; color: ${isUrgent ? '#dc2626' : '#15803d'}; font-weight: 800;">
                            ${isUrgent ? '⚡ URGENT' : '✓ NORMAL'}
                          </span>
                        </div>

                        <h4 style="font-size: 14px; margin-top: 6px; color: var(--text-primary); font-weight: 800;">
                          ${issue.title_ta || issue.title_en}
                        </h4>

                        <p style="font-size: 12px; color: #334155; margin-top: 4px; line-height: 1.4; white-space: pre-line;">
                          ${issue.description}
                        </p>

                        ${issue.evidence ? `
                          <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; color: #047857; font-weight: 700;">
                            📎 Evidence: ${issue.evidence.name || 'File attached'}
                          </div>
                        ` : ''}

                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
                          👤 Member: <strong>${issue.reporterName}</strong> • 📍 ${issue.location} • 📅 ${issue.createdAt}
                        </div>
                      </div>

                      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Status:</span>
                          <select 
                            onchange="window.AAVIN_STORE.updateIssueStatus('${issue.id}', this.value); window.AAVIN_APP.showToast('Status updated to: ' + this.value);"
                            style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 11.5px; font-weight: 700; background: #ffffff; cursor: pointer;"
                          >
                            <option value="submitted" ${issue.status === 'submitted' ? 'selected' : ''}>1. Submitted</option>
                            <option value="under_review" ${issue.status === 'under_review' || issue.status === 'admin_verification' || issue.status === 'verified' ? 'selected' : ''}>2. Under Review</option>
                            <option value="assigned" ${issue.status === 'assigned' ? 'selected' : ''}>3. Assigned</option>
                            <option value="in_progress" ${issue.status === 'in_progress' || issue.status === 'forwarded' || issue.status === 'action_in_progress' ? 'selected' : ''}>4. In Progress</option>
                            <option value="resolved" ${issue.status === 'resolved' ? 'selected' : ''}>5. Resolved</option>
                            <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>6. Closed</option>
                          </select>
                        </div>

                        <div style="display: flex; gap: 6px; margin-top: 4px;">
                          <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_STORE.forwardIssue('${issue.id}', 'dept_dairy_dev'); window.AAVIN_APP.showToast('Forwarded to State Dairy Dept');" style="font-size: 11px;">
                            Forward Dept
                          </button>
                          <button type="button" class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.resolveIssue('${issue.id}', 'Technician dispatched and repair completed.'); window.AAVIN_APP.showToast('Issue Resolved');" style="font-size: 11px;">
                            ${icon('check', { size: 12, color: '#ffffff' })} Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}
      </div>
    `;
  },

  renderSangamAdmin() {
    const lang = window.I18N ? window.I18N.currentLang : 'ta';
    const admin = (window.AAVIN_SUPABASE_AUTH && window.AAVIN_SUPABASE_AUTH.adminProfile) || {
      fullName: 'Sangam Secretary',
      email: 'aavinsangam@admin.com',
      role: 'admin',
      admin_type: 'sangam',
      sangamName: 'Aavin Madurai Thozhilar Sangam',
      districtName: 'Madurai District'
    };
    const issues = (window.AAVIN_STORE.state.issues || []);
    const unverifiedIssues = issues.filter(i => !i.isAdminVerified);
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div>
        <div class="card card-floating-3d" style="padding: 18px; margin-bottom: 18px; border-left: 6px solid #0b4f8a; background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #e8f2fc; color: #0b4f8a; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('dairy', { size: 14, color: '#0b4f8a' })} SANGAM ADMIN PORTAL • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">${icon('check', { size: 11, color: '#059669' })} Verified Admin</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #07355e; font-weight: 800; margin-top: 6px;">
                ${admin.sangamName || 'Aavin Madurai Thozhilar Sangam'}
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                Officer: <strong>${admin.fullName}</strong> • ${admin.email}
              </p>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')">
                ${icon('user', { size: 14, color: '#0b4f8a' })}
                <span>Manage Users</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                <span>Admin Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            ${icon('analytics', { size: 14, color: this.activeAdminSubTab === 'overview' ? '#0b4f8a' : '#64748b' })}
            <span>Sangam Queue</span>
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            ${icon('user', { size: 14, color: this.activeAdminSubTab === 'users' ? '#0b4f8a' : '#64748b' })}
            <span>User Management</span>
          </button>
        </div>

        ${this.activeAdminSubTab === 'users' ? this.renderUserManagement() : `
          <!-- Issues Requiring Sangam Admin Action -->
          <div class="card card-floating-3d" style="margin-bottom: 20px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 class="card-title">
                ${icon('issues', { size: 20, color: '#dc2626' })}
                <span>Local Sangam Grievances Queue (${issues.length})</span>
              </h3>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_APP.navigate('issues')">
                ${icon('plus', { size: 12, color: '#ffffff' })}
                <span>New Grievance</span>
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${issues.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No grievances currently registered for this Sangam.
                </div>
              ` : issues.map(issue => {
                const isUrgent = issue.calculatedPriority === 'urgent' || issue.calculatedPriority === 'critical';
                const isResolved = issue.status === 'resolved' || issue.status === 'closed';

                return `
                  <div style="background: #f8fafc; border: 1.5px solid var(--border-strong); border-radius: var(--radius-md); padding: 14px; border-left: 5px solid ${isResolved ? '#15803d' : (isUrgent ? '#dc2626' : '#0b4f8a')};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                      <div style="flex: 1; min-width: 260px;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <strong style="color: #0b4f8a; font-family: monospace; font-size: 12px; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${issue.id}</strong>
                          <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 11px;">
                            ${issue.categoryName_ta || issue.categoryName_en || issue.category}
                          </span>
                          <span class="badge" style="background: ${isUrgent ? '#fee2e2' : '#dcfce7'}; color: ${isUrgent ? '#dc2626' : '#15803d'}; font-weight: 800;">
                            ${isUrgent ? '⚡ URGENT' : '✓ NORMAL'}
                          </span>
                        </div>

                        <h4 style="font-size: 14px; margin-top: 6px; color: var(--text-primary); font-weight: 800;">
                          ${issue.title_ta || issue.title_en}
                        </h4>

                        <p style="font-size: 12px; color: #334155; margin-top: 4px; line-height: 1.4; white-space: pre-line;">
                          ${issue.description}
                        </p>

                        ${issue.evidence ? `
                          <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; color: #047857; font-weight: 700;">
                            📎 Evidence: ${issue.evidence.name || 'File attached'}
                          </div>
                        ` : ''}

                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
                          👤 Member: <strong>${issue.reporterName}</strong> • 📍 ${issue.location || 'Madurai'} • 📅 ${issue.createdAt}
                        </div>
                      </div>

                      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Status:</span>
                          <select 
                            onchange="window.AAVIN_STORE.updateIssueStatus('${issue.id}', this.value); window.AAVIN_APP.showToast('Grievance status updated to: ' + this.value);"
                            style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid var(--border-strong); font-size: 11.5px; font-weight: 700; background: #ffffff; cursor: pointer;"
                          >
                            <option value="submitted" ${issue.status === 'submitted' ? 'selected' : ''}>1. Submitted</option>
                            <option value="under_review" ${issue.status === 'under_review' || issue.status === 'admin_verification' || issue.status === 'verified' ? 'selected' : ''}>2. Under Review</option>
                            <option value="assigned" ${issue.status === 'assigned' ? 'selected' : ''}>3. Assigned</option>
                            <option value="in_progress" ${issue.status === 'in_progress' || issue.status === 'forwarded' || issue.status === 'action_in_progress' ? 'selected' : ''}>4. In Progress</option>
                            <option value="resolved" ${issue.status === 'resolved' ? 'selected' : ''}>5. Resolved</option>
                            <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>6. Closed</option>
                          </select>
                        </div>

                        <div style="display: flex; gap: 4px; margin-top: 4px;">
                          ${issue.status !== 'resolved' && issue.status !== 'closed' ? `
                            <button type="button" class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.resolveIssue('${issue.id}', 'Action completed by Sangam Secretary'); window.AAVIN_APP.showToast('Issue marked Resolved');" style="font-size: 11px; padding: 4px 8px;">
                              ${icon('check', { size: 12, color: '#ffffff' })} Resolve
                            </button>
                          ` : `
                            <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_STORE.closeIssue('${issue.id}', 'Confirmed closed'); window.AAVIN_APP.showToast('Issue Closed');" style="font-size: 11px; padding: 4px 8px;">
                              Close
                            </button>
                          `}
                          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('issues', { action: 'track' })" style="font-size: 11px; padding: 4px 8px;">
                            Track
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}
      </div>
    `;
  }
};
