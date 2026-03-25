/* ============================================
   schedule.js - Schedule Management Module
   ============================================ */

async function renderSchedule() {
    try {
        const [schedules, batches] = await Promise.all([api('/schedules'), api('/batches')]);
        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-calendar-alt me-2 text-primary-custom"></i>Schedule Management</h4>
            <div class="d-flex gap-2">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary-custom active" id="viewListBtn" onclick="setScheduleView('list')"><i class="fas fa-list me-1"></i>List</button>
                    <button class="btn" id="viewWeekBtn" onclick="setScheduleView('week')"
                            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text-muted)"><i class="fas fa-calendar-week me-1"></i>Week</button>
                </div>
                <button class="btn btn-primary-custom" onclick="showAddSchedule()">
                    <i class="fas fa-plus me-2"></i>Add Schedule
                </button>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <select class="form-select" id="schedBatchFilter" onchange="filterSchedules()">
                    <option value="">All Batches</option>
                    ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <input type="date" class="form-control" id="schedFromDate" placeholder="From Date">
            </div>
            <div class="col-md-3">
                <input type="date" class="form-control" id="schedToDate" placeholder="To Date">
            </div>
            <div class="col-md-2">
                <button class="btn btn-primary-custom w-100" onclick="filterSchedules()"><i class="fas fa-filter me-1"></i>Filter</button>
            </div>
        </div>

        <div id="scheduleViewArea">
            ${renderScheduleList(schedules)}
        </div>`;

        window._allSchedules = schedules;
        window._schedBatches = batches;
    } catch(err) { showError(err.message); }
}

function setScheduleView(view) {
    document.getElementById('viewListBtn').classList.toggle('active', view==='list');
    document.getElementById('viewWeekBtn').classList.toggle('active', view==='week');
    if (view === 'week') {
        renderWeekView(window._allSchedules||[]);
    } else {
        document.getElementById('scheduleViewArea').innerHTML = renderScheduleList(window._allSchedules||[]);
    }
}

function renderScheduleList(schedules) {
    if (!schedules.length) return `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div><p class="empty-state-text">No schedules found</p></div>`;

    const grouped = {};
    schedules.forEach(s => {
        const d = s.classDate||'Unscheduled';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(s);
    });

    return Object.keys(grouped).sort().map(date => `
    <div class="mb-4">
        <div class="d-flex align-items-center gap-3 mb-3">
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:6px 16px;border-radius:20px;font-size:0.8rem;font-weight:700;color:white;">${date !== 'Unscheduled' ? dateFmt(date) : 'Unscheduled'}</div>
            <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
            <span style="color:var(--text-muted);font-size:0.8rem;">${grouped[date].length} class${grouped[date].length>1?'es':''}</span>
        </div>
        ${grouped[date].map(s => scheduleCard(s)).join('')}
    </div>`).join('');
}

function scheduleCard(s) {
    const online = s.classType === 'ONLINE';
    return `
    <div class="schedule-item ${s.isCancelled?'cancelled':''} mb-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="min-width:60px;text-align:center;padding:10px;background:${online?'rgba(102,126,234,0.1)':'rgba(0,176,155,0.1)'};border-radius:10px;">
            <i class="fas ${online?'fa-video':'fa-chalkboard-teacher'}" style="font-size:1.5rem;color:${online?'#667eea':'#00b09b'};display:block;margin-bottom:4px;"></i>
            <span style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">${s.classType}</span>
        </div>
        <div style="flex:1;min-width:180px;">
            <div style="font-weight:700;color:white;font-size:1rem;">${s.title}</div>
            <div style="color:var(--text-muted);font-size:0.8rem;margin-top:4px;">
                <i class="fas fa-layer-group me-1"></i>${s.batch?.batchName||'N/A'}
                ${s.location ? `<span class="ms-2"><i class="fas fa-map-marker-alt me-1"></i>${s.location}</span>` : ''}
            </div>
            ${s.onlineLink ? `<a href="${s.onlineLink}" target="_blank" style="color:var(--primary);font-size:0.75rem;"><i class="fas fa-link me-1"></i>Join Link</a>` : ''}
        </div>
        <div style="text-align:center;min-width:90px;">
            <div style="font-size:1rem;font-weight:700;color:white;">${formatTime(s.startTime)}</div>
            <div style="color:var(--text-muted);font-size:0.75rem;">${formatTime(s.endTime)}</div>
        </div>
        <div>
            ${s.isCancelled
              ? `<span style="background:rgba(255,71,87,0.1);color:#ff4757;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">CANCELLED</span>`
              : statusBadge('ACTIVE')
            }
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
            <button class="btn btn-edit-custom btn-sm" onclick="editSchedule(${s.id})" title="Edit"><i class="fas fa-edit"></i></button>
            ${!s.isCancelled ? `<button class="btn btn-sm" onclick="cancelSchedule(${s.id})"
                style="background:rgba(255,165,2,0.1);color:#ffa502;border:1px solid rgba(255,165,2,0.2);font-size:0.72rem;padding:4px 8px;border-radius:6px;" title="Cancel">
                <i class="fas fa-ban"></i></button>` : ''}
            <button class="btn btn-danger-custom btn-sm" onclick="deleteSchedule(${s.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}

function renderWeekView(schedules) {
    const today   = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push(d);
    }

    const area = document.getElementById('scheduleViewArea');
    area.innerHTML = `
    <div class="row g-2">
        ${days.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            const dayScheds = schedules.filter(s => s.classDate === dateStr);
            const isToday = dateStr === today.toISOString().split('T')[0];
            return `
            <div class="col" style="min-width:120px;">
                <div style="background:${isToday?'rgba(102,126,234,0.15)':'rgba(255,255,255,0.03)'};border:${isToday?'1px solid rgba(102,126,234,0.3)':'1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px;min-height:180px;">
                    <div class="text-center mb-2">
                        <div style="font-size:0.75rem;color:var(--text-muted);">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d.getDay()===0?6:d.getDay()-1]}</div>
                        <div style="font-size:1.4rem;font-weight:700;color:${isToday?'var(--primary)':'white'};">${d.getDate()}</div>
                    </div>
                    ${dayScheds.map(s => `<div style="background:${s.classType==='ONLINE'?'rgba(102,126,234,0.2)':'rgba(0,176,155,0.15)'};border-radius:6px;padding:4px 6px;margin-bottom:4px;font-size:0.7rem;">
                        <div style="color:white;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
                        <div style="color:var(--text-muted);">${formatTime(s.startTime)}</div>
                    </div>`).join('')||'<div style="color:var(--text-muted);font-size:0.72rem;text-align:center;padding-top:8px;">No class</div>'}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function filterSchedules() {
    const batchId = document.getElementById('schedBatchFilter').value;
    let filtered  = window._allSchedules || [];
    if (batchId)  filtered = filtered.filter(s => s.batch?.id == batchId);
    const from = document.getElementById('schedFromDate').value;
    const to   = document.getElementById('schedToDate').value;
    if (from)  filtered = filtered.filter(s => s.classDate >= from);
    if (to)    filtered = filtered.filter(s => s.classDate <= to);
    document.getElementById('scheduleViewArea').innerHTML = renderScheduleList(filtered);
}

async function showAddSchedule() {
    const batches = window._schedBatches || await api('/batches');
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Title *</label><input class="form-control" id="scTitle"></div>
        <div class="col-md-6"><label class="form-label">Batch *</label>
            <select class="form-select" id="scBatch">
                <option value="">Select Batch</option>
                ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Class Type</label>
            <select class="form-select" id="scType" onchange="toggleOnlineField()">
                <option>PHYSICAL</option><option>ONLINE</option>
            </select></div>
        <div class="col-md-6"><label class="form-label">Date *</label><input class="form-control" id="scDate" type="date" min="${new Date().toISOString().split('T')[0]}"></div>
        <div class="col-md-6"><label class="form-label">Start Time *</label><input class="form-control" id="scStart" type="time"></div>
        <div class="col-md-6"><label class="form-label">End Time *</label><input class="form-control" id="scEnd" type="time"></div>
        <div class="col-12" id="locationField"><label class="form-label">Location / Classroom</label><input class="form-control" id="scLocation"></div>
        <div class="col-12" id="linkField" style="display:none;"><label class="form-label">Online Meeting Link</label><input class="form-control" id="scLink" placeholder="https://meet.google.com/..."></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="scDesc" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>Add Schedule', form, saveNewSchedule);
}

function toggleOnlineField() {
    const isOnline = document.getElementById('scType').value === 'ONLINE';
    document.getElementById('locationField').style.display = isOnline ? 'none' : '';
    document.getElementById('linkField').style.display     = isOnline ? '' : 'none';
}

async function saveNewSchedule() {
    const payload = {
        title:       document.getElementById('scTitle').value.trim(),
        batch:       document.getElementById('scBatch').value ? { id: parseInt(document.getElementById('scBatch').value) } : null,
        classType:   document.getElementById('scType').value,
        classDate:   document.getElementById('scDate').value||null,
        startTime:   document.getElementById('scStart').value||null,
        endTime:     document.getElementById('scEnd').value||null,
        location:    document.getElementById('scLocation')?.value.trim()||null,
        onlineLink:  document.getElementById('scLink')?.value.trim()||null,
        description: document.getElementById('scDesc').value,
    };
    if (!payload.title || !payload.batch) return toast('Fill required fields','warning');
    if (payload.classDate && payload.classDate < new Date().toISOString().split('T')[0]) {
        return toast('Class date cannot be in the past', 'warning');
    }
    if (payload.startTime && payload.endTime && payload.endTime <= payload.startTime) {
        return toast('End time must be after start time', 'warning');
    }
    try { await api('/schedules','POST',payload); closeModal(); toast('Schedule created!'); renderSchedule(); }
    catch(err) { showError(err.message); }
}

async function editSchedule(id) {
    const s = await api(`/schedules/${id}`);
    const batchOpts = (window._schedBatches||[]).map(b => `<option value="${b.id}" ${s.batch?.id==b.id?'selected':''}>${b.batchName}</option>`).join('');
    const form = `
    <div class="row g-3">
        <input type="hidden" id="editScId" value="${id}">
        <div class="col-md-6"><label class="form-label">Title</label><input class="form-control" id="escTitle" value="${s.title||''}"></div>
        <div class="col-md-6"><label class="form-label">Batch</label><select class="form-select" id="escBatch">${batchOpts}</select></div>
        <div class="col-md-6"><label class="form-label">Class Type</label>
            <select class="form-select" id="escType">
                <option ${s.classType==='PHYSICAL'?'selected':''}>PHYSICAL</option>
                <option ${s.classType==='ONLINE'?'selected':''}>ONLINE</option>
            </select></div>
        <div class="col-md-6"><label class="form-label">Date</label><input class="form-control" id="escDate" type="date" value="${s.classDate||''}" min="${new Date().toISOString().split('T')[0]}"></div>
        <div class="col-md-6"><label class="form-label">Start Time</label><input class="form-control" id="escStart" type="time" value="${s.startTime||''}"></div>
        <div class="col-md-6"><label class="form-label">End Time</label><input class="form-control" id="escEnd" type="time" value="${s.endTime||''}"></div>
        <div class="col-12"><label class="form-label">Location</label><input class="form-control" id="escLocation" value="${s.location||''}"></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Schedule', form, async() => {
        const payload = {
            title:     document.getElementById('escTitle').value,
            classType: document.getElementById('escType').value,
            classDate: document.getElementById('escDate').value||null,
            startTime: document.getElementById('escStart').value||null,
            endTime:   document.getElementById('escEnd').value||null,
            location:  document.getElementById('escLocation').value,
        };
        if (payload.classDate && payload.classDate < new Date().toISOString().split('T')[0]) {
            return toast('Class date cannot be in the past', 'warning');
        }
        if (payload.startTime && payload.endTime && payload.endTime <= payload.startTime) {
            return toast('End time must be after start time', 'warning');
        }
        try { await api(`/schedules/${id}`,'PUT',payload); closeModal(); toast('Schedule updated!'); renderSchedule(); }
        catch(err) { showError(err.message); }
    });
}

async function cancelSchedule(id) {
    confirmDelete('Cancel this scheduled class?', async() => {
        try { await api(`/schedules/${id}/cancel`,'PUT'); toast('Class cancelled','warning'); renderSchedule(); }
        catch(err) { showError(err.message); }
    }, 'Cancel Class', 'warning');
}

function deleteSchedule(id) {
    confirmDelete('Delete this schedule?', async() => {
        try { await api(`/schedules/${id}`,'DELETE'); toast('Schedule deleted!'); renderSchedule(); }
        catch(err) { showError(err.message); }
    });
}

function formatTime(time) {
    if (!time) return '-';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}
