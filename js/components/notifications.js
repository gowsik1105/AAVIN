/**
 * AAVIN SANGAM (ஆவின் சங்கம்)
 * Real Dynamic Notification Center & Deeplinking Engine
 */

window.AAVIN_COMPONENTS = window.AAVIN_COMPONENTS || {};

window.AAVIN_COMPONENTS.Notifications = {
  getUnreadCount() {
    const notifs = window.AAVIN_STORE.state.notifications || [];
    return notifs.filter(n => !n.read).length;
  },

  markAsRead(id) {
    const notifs = window.AAVIN_STORE.state.notifications || [];
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      window.AAVIN_STORE.notify();
    }
  },

  markAllAsRead() {
    const notifs = window.AAVIN_STORE.state.notifications || [];
    notifs.forEach(n => n.read = true);
    window.AAVIN_STORE.notify();
    window.AAVIN_APP.showToast('All notifications marked as read');
    const modal = document.getElementById('globalModalBackdrop');
    if (modal && modal.classList.contains('open')) {
      window.AAVIN_APP.showNotifications();
    }
  },

  handleNotificationClick(notif) {
    this.markAsRead(notif.id);
    window.AAVIN_APP.closeModal();

    if (notif.targetTab) {
      window.AAVIN_APP.navigate(notif.targetTab, notif.targetParams || {});
    } else {
      window.AAVIN_APP.navigate('home');
    }
  },

  renderModal() {
    const lang = window.I18N.currentLang;
    const notifs = window.AAVIN_STORE.state.notifications || [];
    const unreadCount = this.getUnreadCount();
    const icon = (name, opts) => window.AAVIN_ICONS ? window.AAVIN_ICONS.render(name, opts) : '';

    return `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${icon('bell', { size: 20, color: '#0b4f8a' })}
            <h3 style="font-size: 15px; color: var(--aavin-primary); font-weight: 800;">
              ${window.I18N.t('notifications')} (${unreadCount})
            </h3>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${unreadCount > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="window.AAVIN_COMPONENTS.Notifications.markAllAsRead()">
                ✓ Mark all read
              </button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="window.AAVIN_APP.closeModal()">✕</button>
          </div>
        </div>

        <div class="modal-body" style="max-height: 440px; overflow-y: auto;">
          ${notifs.length === 0 ? `
            <div style="text-align: center; padding: 32px; color: var(--text-muted);">
              ${icon('bell', { size: 36, color: '#94a3b8' })}
              <p style="margin-top: 8px; font-weight: 700;">No notifications found</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${notifs.map(n => `
                <div 
                  style="padding: 12px; border-radius: 12px; background: ${n.read ? '#f8fafc' : '#ffffff'}; border: 1.5px solid ${n.read ? '#e2e8f0' : '#bfdbfe'}; border-left: 4px solid ${n.isPriority ? '#dc2626' : (n.read ? '#94a3b8' : '#0b4f8a')}; cursor: pointer; transition: all 0.2s ease; box-shadow: ${n.read ? 'none' : '0 2px 8px rgba(11,79,138,0.08)'};"
                  onclick="window.AAVIN_COMPONENTS.Notifications.handleNotificationClick(${JSON.stringify(n).replace(/"/g, '&quot;')})"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      ${!n.read ? `<span style="width: 7px; height: 7px; border-radius: 50%; background: #0284c7;"></span>` : ''}
                      <strong style="color: ${n.isPriority ? '#dc2626' : '#0b4f8a'}; font-size: 13px;">${lang === 'ta' ? n.title_ta : n.title_en}</strong>
                    </div>
                    <span style="color: #64748b; font-size: 10.5px;">${n.time}</span>
                  </div>
                  <p style="font-size: 12px; color: #334155; line-height: 1.4;">
                    ${lang === 'ta' ? n.body_ta : n.body_en}
                  </p>
                  <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--aavin-accent);">Tap to view →</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }
};
