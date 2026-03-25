/* ============================================
   app.js - Core Application Logic
   ============================================ */

const API = '';
let token = getAuthToken();
let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let currentPage = 'dashboard';

function getAuthToken() {
    const stored = localStorage.getItem('token');
    if (!stored || stored === 'null' || stored === 'undefined') return null;
    return stored;
}

// ========== AUTH GUARD ==========
if (!token) window.location.href = 'index.html';

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    const isValid = await validateSession();
    if (!isValid) return;
    setUserInfo();
    setCurrentDate();
    loadPage('dashboard');
    loadPendingBadge();
});

async function validateSession() {
    const authToken = getAuthToken();
    if (!authToken) {
        logout();
        return false;
    }

    try {
        const res = await fetch(`/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!res.ok) {
            logout();
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

function setUserInfo() {
    if (currentUser.fullName) {
        document.getElementById('userFullName').textContent = currentUser.fullName;
        document.getElementById('userRole').textContent     = currentUser.role;
        document.getElementById('userAvatar').textContent  = currentUser.fullName.charAt(0).toUpperCase();
    }
}

function setCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

async function loadPendingBadge() {
    try {
        const data = await api('/payments/status/PENDING');
        const badge = document.getElementById('pendingBadge');
        if (badge) badge.textContent = data.length;
    } catch {}
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ========== API HELPER ==========
async function api(endpoint, method = 'GET', body = null) {
    const authToken = getAuthToken();
    if (!authToken) { logout(); throw new Error('Session expired. Please login again.'); }

    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${endpoint}`, opts);
    if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }
    if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        logout();
        throw new Error(err.message || 'Session expired. Please login again.');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
    }
    return res.json().catch(() => ({}));
}

async function apiUpload(endpoint, formData) {
    const authToken = getAuthToken();
    if (!authToken) { logout(); throw new Error('Session expired. Please login again.'); }

    const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
    });
    if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }
    if (res.status === 403) {
        let msg = 'Session expired. Please login again.';
        try {
            const err = await res.json();
            if (err && err.message) msg = err.message;
        } catch {}
        logout();
        throw new Error(msg);
    }
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}

// ========== NAVIGATION ==========
function loadPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navEl = document.getElementById(`nav-${page}`);
    if (navEl) navEl.classList.add('active');

    const titles = {
        dashboard:  ['Dashboard',        'Home / Dashboard'],
        students:   ['Student Management','Academic / Students'],
        batches:    ['Batch Management',  'Academic / Batches'],
        attendance: ['Attendance',        'Academic / Attendance'],
        results:    ['Exam Results',      'Academic / Results'],
        schedule:   ['Class Schedule',    'Academic / Schedule'],
        income:     ['Income Management', 'Finance / Income'],
        marketing:  ['Marketing',         'Growth / Marketing'],
        resources:  ['Learning Resources','Growth / Resources'],
        staff:      ['Staff & HR',        'HR / Staff'],
    };
    const [title, breadcrumb] = titles[page] || ['Page', 'Home'];
    document.getElementById('topbarTitle').textContent     = title;
    document.getElementById('topbarBreadcrumb').textContent = breadcrumb;

    showLoading();
    const content = document.getElementById('pageContent');
    content.innerHTML = '';

    const renderers = {
        dashboard:  renderDashboard,
        students:   renderStudents,
        batches:    renderBatches,
        attendance: renderAttendance,
        results:    renderResults,
        schedule:   renderSchedule,
        income:     renderIncome,
        marketing:  renderMarketing,
        resources:  renderResources,
        staff:      renderStaff,
    };

    (renderers[page] || renderDashboard)().finally(hideLoading);
}

function refreshPage() { loadPage(currentPage); }

// ========== DASHBOARD ==========
async function renderDashboard() {
    try {
        const stats     = await api('/dashboard/stats');
        const schedules = await api('/schedules/today');

        document.getElementById('pageContent').innerHTML = `
        <div class="row g-4 mb-4">
            ${statCard('Total Students',   stats.totalStudents   || 0, 'fa-user-graduate', '#667eea', 'rgba(102,126,234,0.15)')}
            ${statCard('Active Batches',   stats.totalBatches    || 0, 'fa-layer-group',   '#00b09b', 'rgba(0,176,155,0.15)')}
            ${statCard('Staff Members',    stats.totalStaff      || 0, 'fa-users-cog',     '#ffa502', 'rgba(255,165,2,0.15)')}
            ${statCard('Today\'s Classes', stats.todayClasses    || 0, 'fa-calendar-day',  '#2f86eb', 'rgba(47,134,235,0.15)')}
            ${statCard('Total Income',     'Rs. ' + numFmt(stats.totalIncome || 0), 'fa-coins', '#11998e', 'rgba(17,153,142,0.15)')}
            ${statCard('Pending Fees',     stats.pendingPayments || 0, 'fa-exclamation-triangle', '#ff4757', 'rgba(255,71,87,0.15)')}
        </div>

        <div class="row g-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title"><i class="fas fa-chart-bar me-2 text-primary-custom"></i>Monthly Income Overview</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="incomeChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="card-title"><i class="fas fa-calendar-day me-2 text-primary-custom"></i>Today's Classes</h6>
                    </div>
                    <div class="card-body p-3">
                        ${schedules.length === 0
                            ? `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div><p class="empty-state-text">No classes today</p></div>`
                            : schedules.map(s => `
                                <div class="schedule-item ${s.classType === 'ONLINE' ? 'online' : ''}">
                                    <div class="schedule-time"><i class="fas fa-clock me-1"></i>${s.startTime} - ${s.endTime}</div>
                                    <div class="schedule-title">${s.title}</div>
                                    <div class="schedule-batch">
                                        <span class="badge-status ${s.classType === 'ONLINE' ? 'badge-active' : 'badge-pending'}">${s.classType}</span>
                                        ${s.location ? `<span class="ms-2"><i class="fas fa-map-marker-alt me-1"></i>${s.location}</span>` : ''}
                                    </div>
                                </div>`).join('')
                        }
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mt-0">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title"><i class="fas fa-chart-pie me-2 text-primary-custom"></i>Student Intake Sources</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="intakeChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title"><i class="fas fa-tasks me-2 text-primary-custom"></i>Quick Actions</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            ${quickAction('Add Student',   'fa-user-plus',    'students',   '#667eea')}
                            ${quickAction('Mark Attendance','fa-clipboard-check','attendance','#00b09b')}
                            ${quickAction('Add Schedule',  'fa-calendar-plus', 'schedule',   '#ffa502')}
                            ${quickAction('Record Payment','fa-money-bill-wave','income',     '#2f86eb')}
                            ${quickAction('Upload Resource','fa-upload',        'resources',  '#11998e')}
                            ${quickAction('Add Staff',     'fa-user-tie',      'staff',      '#ff4757')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        renderIncomeChart();
        renderIntakeChart();
    } catch (err) {
        showError('Failed to load dashboard: ' + err.message);
    }
}

function statCard(label, value, icon, color, bg) {
    return `
    <div class="col-sm-6 col-lg-4">
        <div class="stat-card" style="--stat-color:${color}; --stat-bg:${bg}">
            <div class="stat-icon"><i class="fas ${icon}"></i></div>
            <div>
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        </div>
    </div>`;
}

function quickAction(label, icon, page, color) {
    return `
    <div class="col-6">
        <button class="btn w-100 py-3" style="background:${color}18; border:1px solid ${color}33; border-radius:12px; color:${color}; font-weight:600; font-size:0.85rem;"
                onclick="loadPage('${page}')">
            <i class="fas ${icon} me-2"></i>${label}
        </button>
    </div>`;
}

async function renderIncomeChart() {
    try {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year   = new Date().getFullYear();
        const data   = await Promise.all(
            months.map((m, i) => api(`/payments/reports/monthly/${String(i+1).padStart(2,'0')}-${year}/${year}`)
                .catch(() => ({ income: 0 })))
        );
        const ctx = document.getElementById('incomeChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Income (Rs.)',
                    data: data.map(d => d.income || 0),
                    backgroundColor: 'rgba(102,126,234,0.6)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#e0e0e0' } } },
                scales: {
                    x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    } catch {}
}

async function renderIntakeChart() {
    try {
        const data = await api('/marketing/intake-sources');
        const ctx  = document.getElementById('intakeChart');
        if (!ctx) return;
        const labels = Object.keys(data);
        const values = Object.values(data);
        const colors = ['#667eea','#764ba2','#00b09b','#ffa502','#ff4757','#2f86eb','#11998e','#e84393'];
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#e0e0e0', font: { size: 11 }, padding: 14 }
                    }
                }
            }
        });
    } catch {}
}

// ========== LOADING / TOAST ==========
function showLoading() { document.getElementById('loadingOverlay').classList.remove('d-none'); }
function hideLoading()  { document.getElementById('loadingOverlay').classList.add('d-none'); }

function toast(message, type = 'success') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle',
                    warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const colors = { success: '#00b09b', error: '#ff4757',
                     warning: '#ffa502', info: '#2f86eb' };
    const container = document.getElementById('toastContainer');
    const el        = document.createElement('div');
    el.className    = `toast-custom toast-${type}`;
    el.innerHTML    = `
        <span class="toast-icon" style="color:${colors[type]}">
            <i class="fas ${icons[type]}"></i>
        </span>
        <span style="color:#e0e0e0">${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.4s'; setTimeout(() => el.remove(), 400); }, 3500);
}
function showError(msg) { toast(msg, 'error'); }

// ========== MODAL HELPERS ==========
function openModal(title, bodyHTML, saveCallback, saveLabel = 'Save') {
    document.getElementById('mainModalTitle').innerHTML  = title;
    document.getElementById('mainModalBody').innerHTML   = bodyHTML;
    document.getElementById('mainModalSave').textContent = saveLabel;
    document.getElementById('mainModalSave').onclick     = saveCallback;
    document.getElementById('mainModalFooter').style.display = saveCallback ? '' : 'none';
    new bootstrap.Modal(document.getElementById('mainModal')).show();
}

function closeModal() {
    bootstrap.Modal.getInstance(document.getElementById('mainModal'))?.hide();
}

function confirmDelete(message, onConfirm) {
    document.getElementById('deleteMessage').textContent = message;
    document.getElementById('confirmDeleteBtn').onclick  = () => {
        bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
        onConfirm();
    };
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

// ========== HELPERS ==========
function numFmt(n) {
    return Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dateFmt(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function statusBadge(status) {
    const map = {
        PAID: 'badge-paid', PENDING: 'badge-pending', OVERDUE: 'badge-overdue',
        PARTIAL: 'badge-warning', ACTIVE: 'badge-active', INACTIVE: 'badge-inactive',
        PRESENT: 'badge-present', ABSENT: 'badge-absent', LATE: 'badge-late',
        SCHEDULED: 'badge-active', COMPLETED: 'badge-paid', CANCELLED: 'badge-overdue',
        POSTPONED: 'badge-warning'
    };
    return `<span class="badge-status ${map[status] || 'badge-inactive'}">${status}</span>`;
}
function gradeColor(g) {
    return g === 'A' ? '#00b09b' : g === 'B' ? '#667eea' :
           g === 'C' ? '#ffa502' : g === 'S' ? '#2f86eb' : '#ff4757';
}
