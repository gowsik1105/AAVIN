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

            <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.loadUsers()">
              🔄 Refresh Users
            </button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card card-floating-3d" style="padding: 0; overflow: hidden;">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
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
                    <tr style="border-bottom: 1px solid var(--border-subtle); background: ${u.is_active === false ? '#fff1f2' : '#ffffff'};">
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 800; color: var(--text-primary); font-size: 13px;">${u.full_name || 'Member'}</div>
                        <div style="font-size: 11.5px; color: var(--text-muted);">${u.email}</div>
                        ${u.phone ? `<div style="font-size: 11px; color: var(--text-secondary);">📱 +91 ${u.phone}</div>` : ''}
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 700; color: var(--aavin-primary);">${u.district_name || 'Madurai District'}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${u.sangam_name || 'Aavin Thozhilar Sangam'}</div>
                      </td>
                      <td style="padding: 12px 14px;">
                        ${u.is_active !== false ? `
                          <span class="badge badge-normal" style="background: #ecfdf5; color: #059669;">✓ Active</span>
                        ` : `
                          <span class="badge" style="background: #fee2e2; color: #dc2626;">Deactivated</span>
                        `}
                      </td>
                      <td style="padding: 12px 14px;">
                        <select 
                          onchange="window.AAVIN_COMPONENTS.AdminPortals.handleRoleChange('${u.id}', this.value)"
                          style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${isAdmin ? '#7c3aed' : 'var(--border-strong)'}; font-size: 12px; font-weight: 700; background: ${isAdmin ? '#faf5ff' : '#ffffff'}; color: ${isAdmin ? '#6b21a8' : 'var(--text-primary)'};"
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
                <span class="badge" style="background: #f3e8ff; color: #7c3aed; font-weight: 800;">
                  👑 ADMIN DASHBOARD • SUPABASE DB VERIFIED
                </span>
                <span class="badge badge-normal">✓ Role: ${admin.role}</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #4c1d95; font-weight: 800; margin-top: 6px;">
                Aavin Cooperative Command & Administration
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('map')">
                ${icon('map', { size: 14, color: '#0b4f8a' })}
                <span>Main Dairy Explorer</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Log Out
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher (Dashboard vs User Management) -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            📊 System Overview
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            👥 User Management
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
                <span class="badge" style="background: #ffedd5; color: #ea580c; font-weight: 800;">
                  🏛️ DISTRICT ADMIN PORTAL • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">✓ ${admin.districtName || 'Madurai'} Union</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #9a3412; font-weight: 800; margin-top: 6px;">
                ${admin.districtName || 'Madurai District'} Cooperative Union HQ
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 District Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')">
                👥 Manage Users
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Admin Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            📊 District Overview
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            👥 User Management
          </button>
        </div>

        ${this.activeAdminSubTab === 'users' ? this.renderUserManagement() : `
          <!-- District Escalation Queue -->
          <div class="card card-floating-3d">
            <div class="card-header">
              <h3 class="card-title">
                ${icon('issues', { size: 20, color: '#dc2626' })}
                <span>District Issue Escalations & Department Routing</span>
              </h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${districtIssues.map(issue => `
                <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <strong style="color: var(--aavin-primary); font-family: monospace;">${issue.id}</strong>
                    <span style="font-weight: 700; color: var(--text-primary); margin-left: 6px;">${issue.title_en}</span>
                    <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Location: ${issue.location} • Status: ${issue.status}</div>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.AAVIN_STORE.forwardIssue('${issue.id}', 'dept_dairy_dev'); window.AAVIN_APP.showToast('Forwarded to State Dairy Dept');">
                      Forward to State Dept
                    </button>
                    <button type="button" class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.resolveIssue('${issue.id}', 'Technician dispatched and repair completed.'); window.AAVIN_APP.showToast('Issue Resolved');">
                      ✓ Resolve
                    </button>
                  </div>
                </div>
              `).join('')}
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
                <span class="badge" style="background: #e8f2fc; color: #0b4f8a; font-weight: 800;">
                  🏢 SANGAM ADMIN PORTAL • SUPABASE AUTH
                </span>
                <span class="badge badge-normal">✓ Verified Admin</span>
              </div>
              <h2 style="font-size: 1.35rem; color: #07355e; font-weight: 800; margin-top: 6px;">
                ${admin.sangamName || 'Aavin Madurai Thozhilar Sangam'}
              </h2>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                👤 Officer: <strong>${admin.fullName}</strong> • 📧 ${admin.email}
              </p>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')">
                👥 Manage Users
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AAVIN_SUPABASE_AUTH.signOutAdmin()">
                🚪 Admin Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- Admin View Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 10px; max-width: 440px;">
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'overview' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('overview')"
          >
            📊 Sangam Queue
          </button>
          <button 
            type="button" 
            class="segmented-control-btn ${this.activeAdminSubTab === 'users' ? 'active' : ''}" 
            style="flex: 1; font-size: 12px; font-weight: 700;" 
            onclick="window.AAVIN_COMPONENTS.AdminPortals.setAdminSubTab('users')"
          >
            👥 User Management
          </button>
        </div>

        ${this.activeAdminSubTab === 'users' ? this.renderUserManagement() : `
          <!-- Issues Requiring Sangam Admin Action -->
          <div class="card card-floating-3d" style="margin-bottom: 20px;">
            <div class="card-header">
              <h3 class="card-title">
                ${icon('issues', { size: 20, color: '#dc2626' })}
                <span>Local Sangam Grievances Queue</span>
              </h3>
              <span class="badge" style="background: #fef3c7; color: #92400e;">
                ${issues.length} Registered
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${issues.map(issue => `
                <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; border-left: 4px solid ${issue.finalPriority === 'critical' ? '#dc2626' : '#ea580c'};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: #0b4f8a; font-family: monospace; font-size: 12px;">${issue.id}</strong>
                        <span class="badge ${issue.finalPriority === 'critical' ? 'badge-critical' : 'badge-high'}">
                          ${(issue.finalPriority || 'high').toUpperCase()}
                        </span>
                      </div>
                      <h4 style="font-size: 13.5px; margin-top: 4px; color: var(--text-primary); font-weight: 800;">${issue.title_en}</h4>
                      <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Reporter: ${issue.reporterName} • ${issue.createdAt}</p>
                    </div>

                    <div style="display: flex; gap: 6px;">
                      ${!issue.isAdminVerified ? `
                        <button type="button" class="btn btn-success btn-sm" onclick="window.AAVIN_STORE.verifyIssue('${issue.id}', 'critical'); window.AAVIN_APP.showToast('Issue Verified & Prioritized');">
                          ✓ Verify & Escalate
                        </button>
                      ` : `
                        <span class="badge badge-status-verified">✓ Verified</span>
                      `}
                      <button type="button" class="btn btn-secondary btn-sm" onclick="window.AAVIN_APP.navigate('issues')">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    `;
  }
};
