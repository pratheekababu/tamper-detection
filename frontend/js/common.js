// ── API ───────────────────────────────────────────────────────────────────────
async function apiReq(endpoint, opts = {}) {
  const token = localStorage.getItem('atds_token');
  const cfg = {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts
  };
  if (cfg.body && typeof cfg.body === 'object') cfg.body = JSON.stringify(cfg.body);
  try {
    const res = await fetch(`/api${endpoint}`, cfg);
    const data = await res.json();
    if (res.status === 401) { logout(); return null; }
    return data;
  } catch (e) {
    showToast('Connection error', 'error');
    return null;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function getUser()  { return JSON.parse(localStorage.getItem('atds_user') || 'null'); }
function getToken() { return localStorage.getItem('atds_token'); }

function requireAuth(roles = []) {
  const user = getUser(), token = getToken();
  if (!user || !token) { window.location.href = '/pages/login.html'; return null; }
  if (roles.length && !roles.includes(user.role)) { window.location.href = '/pages/login.html'; return null; }
  return user;
}

function logout() {
  apiReq('/auth/logout', { method: 'POST' }).catch(() => {});
  ['atds_token','atds_user','atds_student'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/pages/login.html';
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info', dur = 3400) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div'); box.id = 'toastBox';
    box.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(box);
  }
  const colors = {
    success: { bg:'#d1fae5', border:'#10b981', txt:'#065f46', ico:'✅' },
    error:   { bg:'#ffe4e6', border:'#f43f5e', txt:'#9f1239', ico:'❌' },
    warning: { bg:'#fef9c3', border:'#f59e0b', txt:'#78350f', ico:'⚠️' },
    info:    { bg:'#e0e7ff', border:'#6366f1', txt:'#3730a3', ico:'ℹ️' }
  };
  const c = colors[type] || colors.info;
  const t = document.createElement('div');
  t.style.cssText = `display:flex;align-items:center;gap:9px;padding:12px 16px;border-radius:12px;background:${c.bg};border:1.5px solid ${c.border};color:${c.txt};font-size:13.5px;font-family:'Nunito',sans-serif;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:340px;animation:toastIn 0.28s ease;`;
  t.innerHTML = `<span>${c.ico}</span><span>${msg}</span>`;
  const style = document.createElement('style');
  style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}';
  if (!document.querySelector('#toastStyle')) { style.id = 'toastStyle'; document.head.appendChild(style); }
  box.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(16px)'; t.style.transition='all 0.28s'; setTimeout(() => t.remove(), 300); }, dur);
}

// ── Section navigation ────────────────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(`sec-${id}`);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.section === id);
  });
  if (window._onSection) window._onSection(id);
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function buildSidebar(role) {
  const user = getUser();
  if (!user) return '';
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const navDefs = {
    student: {
      color:'var(--accent-indigo)', bg:'var(--pastel-indigo)',
      items: [
        { s:'dashboard',     ico:'🏠', lbl:'Dashboard',        clr:'var(--pastel-indigo)', acc:'var(--accent-indigo)' },
        { s:'profile',       ico:'👤', lbl:'My Profile',       clr:'var(--pastel-purple)', acc:'var(--accent-purple)' },
        { s:'academics',     ico:'🎓', lbl:'Academic Records',  clr:'var(--pastel-blue)',   acc:'var(--accent-blue)'   },
        { s:'attendance',    ico:'📅', lbl:'Attendance',        clr:'var(--pastel-green)',  acc:'var(--accent-green)'  },
        { s:'courses',       ico:'📚', lbl:'Courses',           clr:'var(--pastel-sky)',    acc:'var(--accent-sky)'    },
        { s:'assignments',   ico:'✏️', lbl:'Assignments',       clr:'var(--pastel-orange)', acc:'var(--accent-orange)' },
        { s:'timetable',     ico:'🕐', lbl:'Timetable',         clr:'var(--pastel-teal)',   acc:'var(--accent-teal)'   },
        { s:'fees',          ico:'💳', lbl:'Fee Details',       clr:'var(--pastel-pink)',   acc:'var(--accent-pink)'   },
        { s:'notifications', ico:'🔔', lbl:'Notifications',     clr:'var(--pastel-yellow)', acc:'var(--accent-yellow)', badge:3 },
      ]
    },
    faculty: {
      color:'var(--accent-teal)', bg:'var(--pastel-teal)',
      items: [
        { s:'dashboard',   ico:'🏠', lbl:'Dashboard',        clr:'var(--pastel-teal)',   acc:'var(--accent-teal)'   },
        { s:'profile',     ico:'👤', lbl:'My Profile',       clr:'var(--pastel-purple)', acc:'var(--accent-purple)' },
        { s:'students',    ico:'🎓', lbl:'Student List',      clr:'var(--pastel-blue)',   acc:'var(--accent-blue)'   },
        { s:'marks',       ico:'📝', lbl:'Mark Management',   clr:'var(--pastel-indigo)', acc:'var(--accent-indigo)' },
        { s:'attendance',  ico:'📅', lbl:'Attendance',        clr:'var(--pastel-green)',  acc:'var(--accent-green)'  },
        { s:'assignments', ico:'✏️', lbl:'Assignments',       clr:'var(--pastel-orange)', acc:'var(--accent-orange)' },
        { s:'timetable',   ico:'🕐', lbl:'Timetable',         clr:'var(--pastel-sky)',    acc:'var(--accent-sky)'    },
        { s:'announcements',ico:'📢',lbl:'Announcements',     clr:'var(--pastel-pink)',   acc:'var(--accent-pink)'   },
        { s:'requests',    ico:'📋', lbl:'Edit Requests',     clr:'var(--pastel-yellow)', acc:'var(--accent-yellow)', badge:'' },
      ]
    },
    admin: {
      color:'var(--accent-pink)', bg:'var(--pastel-pink)',
      items: [
        { s:'dashboard',     ico:'🏠', lbl:'Dashboard',        clr:'var(--pastel-pink)',   acc:'var(--accent-pink)'   },
        { s:'profile',       ico:'👤', lbl:'My Profile',       clr:'var(--pastel-purple)', acc:'var(--accent-purple)' },
        { s:'analytics',     ico:'📊', lbl:'Analytics',        clr:'var(--pastel-blue)',   acc:'var(--accent-blue)'   },
        { s:'students',      ico:'🎓', lbl:'Students',          clr:'var(--pastel-indigo)', acc:'var(--accent-indigo)' },
        { s:'faculty',       ico:'👨‍🏫', lbl:'Faculty',          clr:'var(--pastel-teal)',   acc:'var(--accent-teal)'   },
        { s:'departments',   ico:'🏛️', lbl:'Departments',      clr:'var(--pastel-sky)',    acc:'var(--accent-sky)'    },
        { s:'fees',          ico:'💳', lbl:'Fee Management',    clr:'var(--pastel-green)',  acc:'var(--accent-green)'  },
        { s:'requests',      ico:'📋', lbl:'Edit Requests',     clr:'var(--pastel-orange)', acc:'var(--accent-orange)', badge:'' },
        { s:'integrity',     ico:'🔐', lbl:'Integrity Check',   clr:'var(--pastel-rose)',   acc:'var(--accent-rose)'   },
        { s:'audit',         ico:'📄', lbl:'Audit Logs',        clr:'var(--pastel-yellow)', acc:'var(--accent-yellow)' },
        { s:'announcements', ico:'📢', lbl:'Announcements',     clr:'var(--pastel-teal)',   acc:'var(--accent-teal)'   },
      ]
    }
  };

  const def = navDefs[role];
  const roleLabel = { student:'Student', faculty:'Faculty', admin:'Administrator' }[role];
  const avatarStyle = `background:${def.bg};color:${def.color};`;

  const navHTML = def.items.map(it => `
    <button class="nav-item" data-section="${it.s}" onclick="showSection('${it.s}')">
      <span class="nav-ico" style="background:${it.clr};color:${it.acc};">${it.ico}</span>
      <span>${it.lbl}</span>
      ${it.badge !== undefined ? `<span class="nav-badge b-rose" id="badge-${it.s}" style="display:${it.badge ? 'inline' : 'none'}">${it.badge || ''}</span>` : ''}
    </button>
  `).join('');

  return `
    <div class="sidebar-brand">
      <div class="brand-logo" style="background:${def.bg};">🛡️</div>
      <div>
        <div class="brand-name">ATDS Portal</div>
        <div class="brand-tagline">Tamper Detection</div>
      </div>
    </div>
    <div class="sidebar-user" style="background:${def.bg}20;">
      <div class="u-avatar" style="${avatarStyle}">${initials}</div>
      <div>
        <div class="u-name">${user.name}</div>
        <div class="u-role">🎓 ${roleLabel}</div>
      </div>
    </div>
    <div class="nav-section-lbl">Menu</div>
    ${navHTML}
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="logout()">🚪 Sign Out</button>
    </div>
  `;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDT(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function statusBadge(s) {
  const m = {
    pending:  '<span class="badge b-yellow">⏳ Pending</span>',
    approved: '<span class="badge b-green">✅ Approved</span>',
    rejected: '<span class="badge b-rose">❌ Rejected</span>',
    verified: '<span class="badge b-green">🔒 Verified</span>',
    tampered: '<span class="badge b-rose">⚠️ Tampered</span>',
    active:   '<span class="badge b-green">● Active</span>',
    inactive: '<span class="badge b-muted">● Inactive</span>',
    present:  '<span class="badge b-green">Present</span>',
    absent:   '<span class="badge b-rose">Absent</span>',
    late:     '<span class="badge b-yellow">Late</span>',
  };
  return m[s] || `<span class="badge b-muted">${s}</span>`;
}
function truncHash(h) {
  return h && h.length >= 16 ? h.substring(0,8)+'…'+h.substring(h.length-8) : h;
}

// ── Loading helpers ───────────────────────────────────────────────────────────
function loadingHTML(msg='Loading…') {
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:12px;color:var(--text-muted);">
    <div style="width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--accent-indigo);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <span style="font-size:13px;font-weight:600;">${msg}</span>
  </div>`;
}
function emptyHTML(msg='No data found', ico='📭') {
  return `<div style="text-align:center;padding:40px;color:var(--text-muted);">
    <div style="font-size:38px;margin-bottom:10px;opacity:0.45;">${ico}</div>
    <div style="font-size:13px;font-weight:600;">${msg}</div>
  </div>`;
}
