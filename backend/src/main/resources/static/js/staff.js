/* ============================================
   staff.js - Human Resource & Staff Management
   ============================================ */

async function renderStaff() {
    try {
        const staff = await api('/staff');

        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-users-cog me-2 text-primary-custom"></i>Human Resource Management</h4>
            <button class="btn btn-primary-custom" onclick="showAddStaff()">
                <i class="fas fa-plus me-2"></i>Add Staff
            </button>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#667eea; --stat-bg:rgba(102,126,234,0.1)">
                    <div class="stat-icon"><i class="fas fa-users-cog"></i></div>
                    <div><div class="stat-value">${staff.length}</div><div class="stat-label">Total Staff</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#00b09b; --stat-bg:rgba(0,176,155,0.1)">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div><div class="stat-value">${staff.filter(s=>s.isActive).length}</div><div class="stat-label">Active</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#ffa502; --stat-bg:rgba(255,165,2,0.1)">
                    <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div><div class="stat-value">Rs.${numFmt(staff.reduce((s,m)=>s+(m.basicSalary||0),0))}</div><div class="stat-label">Total Salary</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#e84393; --stat-bg:rgba(232,67,147,0.1)">
                    <div class="stat-icon"><i class="fas fa-user-tie"></i></div>
                    <div><div class="stat-value">${staff.filter(s=>s.role==='ADMIN'||s.role==='COORDINATOR').length}</div><div class="stat-label">Admins/Coordinators</div></div>
                </div>
            </div>
        </div>

        <ul class="nav mb-4" id="hrTab" style="border-bottom:1px solid rgba(255,255,255,0.08);">
            <li class="nav-item"><a class="nav-link active" href="#" onclick="showHrTab('staffList',this)"><i class="fas fa-id-card me-1"></i>Staff</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showHrTab('attendance',this)"><i class="fas fa-clipboard-check me-1"></i>Attendance</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showHrTab('payroll',this)"><i class="fas fa-file-invoice-dollar me-1"></i>Payroll</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="showHrTab('tasks',this)"><i class="fas fa-tasks me-1"></i>Tasks</a></li>
        </ul>

        <div id="hrTabContent">
            ${renderStaffList(staff)}
        </div>`;

        window._allStaff = staff;

    } catch(err) { showError(err.message); }
}

async function showHrTab(tab, el) {
    document.querySelectorAll('#hrTab .nav-link').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
    const area = document.getElementById('hrTabContent');
    if (tab === 'staffList')  area.innerHTML = renderStaffList(window._allStaff||[]);
    if (tab === 'attendance') await loadStaffAttendance(area);
    if (tab === 'payroll')    await loadStaffPayroll(area);
    if (tab === 'tasks')      await loadStaffTasks(area);
    return false;
}

function renderStaffList(staff) {
    if (!staff.length) return `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-users"></i></div><p class="empty-state-text">No staff members yet</p></div>`;
    return `
    <div class="row g-4">
        ${staff.map(s => staffCard(s)).join('')}
    </div>`;
}

function staffCard(s) {
    const roleColors = { ADMIN:'#667eea', ASSISTANT:'#00b09b', COORDINATOR:'#ffa502', TEACHER:'#e84393' };
    const color = roleColors[s.role] || '#8892a4';
    return `
    <div class="col-md-6 col-xl-4">
        <div class="card h-100">
            <div class="card-body">
                <div class="d-flex align-items-center gap-3 mb-4">
                    <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,${color},${color}99);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;flex-shrink:0;">${s.fullName.charAt(0)}</div>
                    <div>
                        <div style="font-weight:700;color:white;font-size:1rem;">${s.fullName}</div>
                        <code style="color:var(--primary);font-size:0.75rem;">${s.staffId}</code>
                        <div class="mt-1">
                            <span style="background:${color}18;color:${color};padding:3px 8px;border-radius:8px;font-size:0.72rem;font-weight:600;">${s.role}</span>
                        </div>
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6"><small style="color:var(--text-muted)">Phone</small><div style="color:white;font-size:0.85rem;">${s.phone||'-'}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Email</small><div style="color:white;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;">${s.email||'-'}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Basic Salary</small><div style="color:#00b09b;font-weight:700;">Rs.${numFmt(s.basicSalary||0)}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Joined</small><div style="color:white;font-size:0.85rem;">${dateFmt(s.joinedDate)}</div></div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-edit-custom btn-sm flex-fill" onclick="editStaff(${s.id})"><i class="fas fa-edit me-1"></i>Edit</button>
                    <button class="btn btn-danger-custom btn-sm flex-fill" onclick="deleteStaff(${s.id},'${s.fullName.replace(/'/g,"\\'")}')"><i class="fas fa-trash me-1"></i>Remove</button>
                </div>
            </div>
        </div>
    </div>`;
}

async function loadStaffAttendance(area) {
    try {
        const staff    = window._allStaff || [];
        const today    = new Date().toISOString().split('T')[0];
        const records  = await api(`/staff/attendance/date/${today}`).catch(()=>[]);
        area.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-5">
                <div class="card">
                    <div class="card-header"><h6 class="card-title">Mark Today's Attendance</h6></div>
                    <div class="card-body">
                        <div style="max-height:380px;overflow-y:auto;">
                            ${staff.filter(s=>s.isActive).map(s => `
                            <div class="d-flex align-items-center justify-content-between p-2 mb-2" style="background:rgba(255,255,255,0.03);border-radius:8px;">
                                <span style="font-size:0.85rem;color:white;">${s.fullName}</span>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn satt-btn" data-sid="${s.id}" data-status="PRESENT"
                                            style="background:rgba(0,176,155,0.2);color:#00b09b;border:1px solid rgba(0,176,155,0.3);font-size:0.7rem;"
                                            onclick="setSAtt(this)">P</button>
                                    <button class="btn satt-btn" data-sid="${s.id}" data-status="ABSENT"
                                            style="background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);font-size:0.7rem;"
                                            onclick="setSAtt(this)">A</button>
                                    <button class="btn satt-btn" data-sid="${s.id}" data-status="HALF_DAY"
                                            style="background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);font-size:0.7rem;"
                                            onclick="setSAtt(this)">H</button>
                                    <button class="btn satt-btn" data-sid="${s.id}" data-status="LEAVE"
                                            style="background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,0.1);font-size:0.7rem;"
                                            onclick="setSAtt(this)">L</button>
                                </div>
                            </div>`).join('')}
                        </div>
                        <button class="btn btn-primary-custom w-100 mt-3" onclick="submitStaffAtt()"><i class="fas fa-save me-2"></i>Save Attendance</button>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="card">
                    <div class="card-header"><h6 class="card-title">Today's Records – ${dateFmt(today)}</h6></div>
                    <div class="card-body p-0">
                        ${records.length
                          ? `<div class="table-responsive"><table class="table"><thead><tr><th>Staff</th><th>Status</th><th>Time</th></tr></thead><tbody>
                             ${records.map(r=>`<tr><td style="color:white">${r.staff?.fullName||'-'}</td><td>${statusBadge(r.status)}</td><td style="color:var(--text-muted)">${r.checkInTime||'-'}</td></tr>`).join('')}
                             </tbody></table></div>`
                          : `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-calendar-day"></i></div><p class="empty-state-text">No attendance records for today</p></div>`}
                    </div>
                </div>
            </div>
        </div>`;
        window._staffForAtt = staff.filter(s=>s.isActive);
    } catch(err) { showError(err.message); }
}

function setSAtt(btn) {
    const sid = btn.dataset.sid;
    document.querySelectorAll(`.satt-btn[data-sid="${sid}"]`).forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-muted)';
    });
    const colors = { PRESENT:'#00b09b', ABSENT:'#ff4757', HALF_DAY:'#ffa502', LEAVE:'#667eea' };
    btn.style.color = colors[btn.dataset.status] || 'white';
    btn.style.background = `${btn.style.color}22`;
}

async function submitStaffAtt() {
    const today   = new Date().toISOString().split('T')[0];
    const records = (window._staffForAtt||[]).map(s => {
        let status = 'PRESENT';
        document.querySelectorAll(`.satt-btn[data-sid="${s.id}"]`).forEach(b => {
            if (b.style.color !== 'var(--text-muted)' && b.style.color !== 'transparent' && b.style.color !== '') status = b.dataset.status;
        });
        return { staff:{id:s.id}, date:today, status };
    });

    if (!records.length) {
        return toast('No active staff available to mark attendance', 'warning');
    }

    try {
        await api('/staff/attendance/bulk','POST',records);
        toast(`Attendance saved for ${records.length} staff!`);
    } catch(err) { showError(err.message); }
}

async function loadStaffPayroll(area) {
    try {
        const today  = new Date();
        const month  = today.getMonth() + 1;
        const year   = today.getFullYear();
        const payrolls = await api(`/staff/payroll/month/${month}/year/${year}`).catch(()=>[]);
        area.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h6 style="color:white;margin:0">Payroll – ${today.toLocaleString('default',{month:'long'})} ${year}</h6>
            <button class="btn btn-primary-custom btn-sm" onclick="showGeneratePayroll(${month},${year})"><i class="fas fa-plus me-2"></i>Generate Payslip</button>
        </div>
        <div class="table-container">
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Staff</th><th>Basic Salary</th><th>Commission</th><th>Bonuses</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${payrolls.length
                          ? payrolls.map(p => `
                          <tr>
                            <td style="color:white;font-weight:600">${p.staff?.fullName||'-'}</td>
                            <td>Rs.${numFmt(p.basicSalary||0)}</td>
                            <td>Rs.${numFmt(p.commission||0)}</td>
                            <td style="color:#00b09b">+Rs.${numFmt(p.bonuses||0)}</td>
                            <td style="color:#ff4757">-Rs.${numFmt(p.deductions||0)}</td>
                            <td style="color:#00b09b;font-weight:700;font-size:1rem;">Rs.${numFmt(p.netSalary||0)}</td>
                            <td>${statusBadge(p.isPaid?'PAID':'PENDING')}</td>
                            <td>
                                ${!p.isPaid
                                  ? `<button class="btn btn-sm" onclick="markPayrollPaid(${p.id})"
                                        style="background:rgba(0,176,155,0.1);color:#00b09b;border:1px solid rgba(0,176,155,0.2);font-size:0.72rem;padding:4px 10px;border-radius:6px;">Mark Paid</button>`
                                  : '<span style="color:#00b09b;font-size:0.8rem;"><i class="fas fa-check me-1"></i>Paid</span>'}
                            </td>
                          </tr>`).join('')
                          : `<tr><td colspan="8" class="text-center py-5" style="color:var(--text-muted)">No payroll records for this month</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
    } catch(err) { showError(err.message); }
}

function showGeneratePayroll(month, year) {
    const staff = window._allStaff || [];
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Staff *</label>
            <select class="form-select" id="prStaff">
                <option value="">Select Staff</option>
                ${staff.map(s=>`<option value="${s.id}">${s.fullName} (${s.staffId})</option>`).join('')}
            </select></div>
        <div class="col-md-3"><label class="form-label">Month</label><input class="form-control" id="prMonth" type="number" value="${month}" min="1" max="12"></div>
        <div class="col-md-3"><label class="form-label">Year</label><input class="form-control" id="prYear" type="number" value="${year}"></div>
        <div class="col-md-6"><label class="form-label">Commission (Rs.)</label><input class="form-control" id="prCommission" type="number" step="0.01" value="0"></div>
        <div class="col-md-6"><label class="form-label">Bonuses (Rs.)</label><input class="form-control" id="prBonuses" type="number" step="0.01" value="0"></div>
        <div class="col-md-6"><label class="form-label">Deductions (Rs.)</label><input class="form-control" id="prDeductions" type="number" step="0.01" value="0"></div>
        <div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" id="prNotes" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-file-invoice-dollar me-2"></i>Generate Payslip', form, async()=>{
        const payload = {
            staff: { id: parseInt(document.getElementById('prStaff').value) },
            month: parseInt(document.getElementById('prMonth').value),
            year:  parseInt(document.getElementById('prYear').value),
            commission:  parseFloat(document.getElementById('prCommission').value)||0,
            bonuses:     parseFloat(document.getElementById('prBonuses').value)||0,
            deductions:  parseFloat(document.getElementById('prDeductions').value)||0,
            notes:       document.getElementById('prNotes').value,
        };
        if (!payload.staff.id) return toast('Select staff','warning');
        try { await api('/staff/payroll','POST',payload); closeModal(); toast('Payslip generated!'); loadStaffPayroll(document.getElementById('hrTabContent')); }
        catch(err) { showError(err.message); }
    });
}

async function markPayrollPaid(id) {
    try {
        await api(`/staff/payroll/${id}/mark-paid`,'PUT');
        toast('Marked as paid!');
        loadStaffPayroll(document.getElementById('hrTabContent'));
    } catch(err) { showError(err.message); }
}

async function loadStaffTasks(area) {
    try {
        const [tasks, staff] = await Promise.all([api('/staff/tasks'), api('/staff')]);
        const priorityColors = { LOW:'#8892a4', MEDIUM:'#667eea', HIGH:'#ffa502', URGENT:'#ff4757' };
        const statusCounts = { PENDING:0, IN_PROGRESS:0, COMPLETED:0, CANCELLED:0 };
        tasks.forEach(t => { if (statusCounts[t.status]!==undefined) statusCounts[t.status]++; });

        area.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 style="color:white;margin:0">Task Board</h6>
            <button class="btn btn-primary-custom btn-sm" onclick="showAddTask()"><i class="fas fa-plus me-2"></i>Add Task</button>
        </div>
        <div class="row g-3 mb-4">
            ${[['PENDING','#ffa502'],['IN_PROGRESS','#667eea'],['COMPLETED','#00b09b'],['CANCELLED','#ff4757']].map(([s,c])=>`
            <div class="col-6 col-md-3">
                <div class="stat-card" style="--stat-color:${c};--stat-bg:${c}18;">
                    <div class="stat-icon"><i class="fas fa-${s==='PENDING'?'hourglass-start':s==='IN_PROGRESS'?'spinner':s==='COMPLETED'?'check-circle':'times-circle'}"></i></div>
                    <div><div class="stat-value">${statusCounts[s]}</div><div class="stat-label">${s.replace('_',' ')}</div></div>
                </div>
            </div>`).join('')}
        </div>
        <div class="table-container">
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${tasks.length
                          ? tasks.map(t => `
                          <tr>
                            <td>
                                <div style="color:white;font-weight:600;">${t.title}</div>
                                ${t.description ? `<div style="font-size:0.72rem;color:var(--text-muted)">${t.description}</div>` : ''}
                            </td>
                            <td style="color:var(--text-muted)">${t.assignedTo?.fullName||'Unassigned'}</td>
                            <td><span style="background:${priorityColors[t.priority]||'#8892a4'}18;color:${priorityColors[t.priority]||'#8892a4'};padding:3px 10px;border-radius:8px;font-size:0.73rem;font-weight:600;">${t.priority}</span></td>
                            <td style="color:var(--text-muted)">${dateFmt(t.dueDate)}</td>
                            <td>${statusBadge(t.status)}</td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-edit-custom btn-sm" onclick="editTask(${t.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-danger-custom btn-sm" onclick="deleteTask(${t.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                          </tr>`).join('')
                          : `<tr><td colspan="6" class="text-center py-5" style="color:var(--text-muted)">No tasks found</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
        window._taskStaff = staff;
    } catch(err) { showError(err.message); }
}

function showAddTask() {
    const staff = window._taskStaff || window._allStaff || [];
    const form = `
    <div class="row g-3">
        <div class="col-12"><label class="form-label">Title *</label><input class="form-control" id="tTitle"></div>
        <div class="col-md-6"><label class="form-label">Assign To *</label>
            <select class="form-select" id="tAssigned">
                <option value="">Select Staff</option>
                ${staff.map(s=>`<option value="${s.id}">${s.fullName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Priority</label>
            <select class="form-select" id="tPriority"><option>LOW</option><option selected>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></div>
        <div class="col-md-6"><label class="form-label">Due Date</label><input class="form-control" id="tDue" type="date"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="tStatus"><option>PENDING</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option></select></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="tDesc" rows="3"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>Add Task', form, async ()=> {
        const payload = {
            title:       document.getElementById('tTitle').value.trim(),
            assignedTo:  document.getElementById('tAssigned').value ? {id:parseInt(document.getElementById('tAssigned').value)} : null,
            priority:    document.getElementById('tPriority').value,
            status:      document.getElementById('tStatus').value,
            dueDate:     document.getElementById('tDue').value||null,
            description: document.getElementById('tDesc').value,
        };
        if (!payload.title) return toast('Enter task title','warning');
        if (!payload.assignedTo) return toast('Please assign a staff member', 'warning');
        try { await api('/staff/tasks','POST',payload); closeModal(); toast('Task created!'); loadStaffTasks(document.getElementById('hrTabContent')); }
        catch(err) { showError(err.message); }
    });
}

async function editTask(id) {
    const t = await api(`/staff/tasks/${id}`);
    const staff = window._taskStaff || window._allStaff || [];
    const form = `
    <div class="row g-3">
        <input type="hidden" id="etId" value="${id}">
        <div class="col-12"><label class="form-label">Title</label><input class="form-control" id="etTitle" value="${t.title}"></div>
        <div class="col-md-6"><label class="form-label">Assign To</label>
            <select class="form-select" id="etAssigned">
                <option value="">Unassigned</option>
                ${staff.map(s=>`<option value="${s.id}" ${t.assignedTo?.id==s.id?'selected':''}>${s.fullName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="etStatus">
                ${['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'].map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Priority</label>
            <select class="form-select" id="etPriority">
                ${['LOW','MEDIUM','HIGH','URGENT'].map(p=>`<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Due Date</label><input class="form-control" id="etDue" type="date" value="${t.dueDate||''}"></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="etDesc" rows="2">${t.description||''}</textarea></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Task', form, async () => {
        const payload = {
            title:       document.getElementById('etTitle').value,
            assignedTo:  document.getElementById('etAssigned').value ? {id:parseInt(document.getElementById('etAssigned').value)} : null,
            status:      document.getElementById('etStatus').value,
            priority:    document.getElementById('etPriority').value,
            dueDate:     document.getElementById('etDue').value||null,
            description: document.getElementById('etDesc').value,
        };
        try { await api(`/staff/tasks/${id}`,'PUT',payload); closeModal(); toast('Task updated!'); loadStaffTasks(document.getElementById('hrTabContent')); }
        catch(err) { showError(err.message); }
    });
}

function deleteTask(id) {
    confirmDelete('Delete this task?', async() => {
        try { await api(`/staff/tasks/${id}`,'DELETE'); toast('Task deleted!'); loadStaffTasks(document.getElementById('hrTabContent')); }
        catch(err) { showError(err.message); }
    });
}

async function showAddStaff() {
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Full Name *</label><input class="form-control" id="sfName"></div>
        <div class="col-md-6"><label class="form-label">Role *</label>
            <select class="form-select" id="sfRole"><option>ASSISTANT</option><option>ADMIN</option><option>COORDINATOR</option><option>TEACHER</option></select></div>
        <div class="col-md-6"><label class="form-label">Phone *</label><input class="form-control" id="sfPhone"></div>
        <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" id="sfEmail" type="email"></div>
        <div class="col-md-6"><label class="form-label">Basic Salary (Rs.)</label><input class="form-control" id="sfSalary" type="number" step="0.01"></div>
        <div class="col-md-6"><label class="form-label">Commission Rate (%)</label><input class="form-control" id="sfComm" type="number" step="0.01" value="0"></div>
        <div class="col-md-6"><label class="form-label">Join Date</label><input class="form-control" id="sfJoin" type="date" max="${new Date().toISOString().split('T')[0]}"></div>
        <div class="col-12"><label class="form-label">Address</label><textarea class="form-control" id="sfAddress" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-user-plus me-2"></i>Add Staff Member', form, async()=>{
        const payload = {
            fullName:       document.getElementById('sfName').value.trim(),
            role:           document.getElementById('sfRole').value,
            phone:          document.getElementById('sfPhone').value.trim(),
            email:          document.getElementById('sfEmail').value.trim(),
            basicSalary:    parseFloat(document.getElementById('sfSalary').value)||0,
            commissionRate: parseFloat(document.getElementById('sfComm').value)||0,
            joinedDate:     document.getElementById('sfJoin').value||null,
            address:        document.getElementById('sfAddress').value,
        };
        if (!payload.fullName||!payload.phone) return toast('Fill required fields','warning');
        if (payload.joinedDate && payload.joinedDate > new Date().toISOString().split('T')[0]) {
            return toast('Join date cannot be in the future', 'warning');
        }
        try { await api('/staff','POST',payload); closeModal(); toast('Staff member added!'); renderStaff(); }
        catch(err) { showError(err.message); }
    });
}

async function editStaff(id) {
    const s = await api(`/staff/${id}`);
    const form = `
    <div class="row g-3">
        <input type="hidden" id="esId" value="${id}">
        <div class="col-md-6"><label class="form-label">Full Name</label><input class="form-control" id="esfName" value="${s.fullName}"></div>
        <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" id="esfPhone" value="${s.phone||''}"></div>
        <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" id="esfEmail" value="${s.email||''}"></div>
        <div class="col-md-6"><label class="form-label">Role</label>
            <select class="form-select" id="esfRole">
                ${['ASSISTANT','ADMIN','COORDINATOR','TEACHER'].map(r=>`<option ${s.role===r?'selected':''}>${r}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Basic Salary</label><input class="form-control" id="esfSalary" type="number" value="${s.basicSalary||0}"></div>
        <div class="col-md-6"><label class="form-label">Commission Rate (%)</label><input class="form-control" id="esfComm" type="number" value="${s.commissionRate||0}"></div>
        <div class="col-md-6"><label class="form-label">Join Date</label><input class="form-control" id="esfJoin" type="date" value="${s.joinedDate||''}" max="${new Date().toISOString().split('T')[0]}"></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Staff', form, async()=>{
        const payload = {
            fullName:       document.getElementById('esfName').value,
            phone:          document.getElementById('esfPhone').value,
            email:          document.getElementById('esfEmail').value,
            role:           document.getElementById('esfRole').value,
            basicSalary:    parseFloat(document.getElementById('esfSalary').value)||0,
            commissionRate: parseFloat(document.getElementById('esfComm').value)||0,
            joinedDate:     document.getElementById('esfJoin').value||null,
        };
        if (payload.joinedDate && payload.joinedDate > new Date().toISOString().split('T')[0]) {
            return toast('Join date cannot be in the future', 'warning');
        }
        try { await api(`/staff/${id}`,'PUT',payload); closeModal(); toast('Staff updated!'); renderStaff(); }
        catch(err) { showError(err.message); }
    });
}

function deleteStaff(id, name) {
    confirmDelete(`Remove staff member "${name}"?`, async()=>{
        try { await api(`/staff/${id}`,'DELETE'); toast('Staff member removed!'); renderStaff(); }
        catch(err) { showError(err.message); }
    });
}
