/* ============================================
   students.js - Student Management Module
   ============================================ */

async function renderStudents() {
    try {
        const [students, batches] = await Promise.all([
            api('/students'),
            api('/batches')
        ]);

        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-user-graduate me-2 text-primary-custom"></i>Student Management</h4>
            <div class="d-flex gap-2">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" class="form-control" id="studentSearch"
                           placeholder="Search students..." oninput="filterStudents()" style="width:220px;">
                </div>
                <button class="btn btn-primary-custom btn-student-add" onclick="showAddStudent()">
                    <i class="fas fa-plus me-2"></i>Add Student
                </button>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#667eea; --stat-bg:rgba(102,126,234,0.1)">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#00b09b; --stat-bg:rgba(0,176,155,0.1)">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div><div class="stat-value">${students.filter(s=>s.isActive).length}</div><div class="stat-label">Active</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#ffa502; --stat-bg:rgba(255,165,2,0.1)">
                    <div class="stat-icon"><i class="fas fa-venus-mars"></i></div>
                    <div><div class="stat-value">${students.filter(s=>s.gender==='MALE').length}</div><div class="stat-label">Male Students</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#e84393; --stat-bg:rgba(232,67,147,0.1)">
                    <div class="stat-icon"><i class="fas fa-venus"></i></div>
                    <div><div class="stat-value">${students.filter(s=>s.gender==='FEMALE').length}</div><div class="stat-label">Female Students</div></div>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="p-3 border-bottom border-custom d-flex gap-2 flex-wrap">
                <select class="form-select" id="batchFilter" style="width:180px;" onchange="filterStudents()">
                    <option value="">All Batches</option>
                    ${batches.map(b => `<option value="${b.id}">${b.batchName}</option>`).join('')}
                </select>
                <select class="form-select" id="genderFilter" style="width:140px;" onchange="filterStudents()">
                    <option value="">All Genders</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="table" id="studentsTable">
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Phone</th><th>School</th>
                            <th>A/L Year</th><th>Intake Source</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsBody">
                        ${renderStudentRows(students)}
                    </tbody>
                </table>
            </div>
        </div>`;

        window._allStudents = students;
    } catch (err) { showError(err.message); }
}

function renderStudentRows(students) {
    if (!students.length) return `<tr><td colspan="8" class="text-center py-5" style="color:var(--text-muted)">No students found</td></tr>`;
    return students.map(s => `
    <tr>
        <td><code style="color:var(--primary)">${s.studentId}</code></td>
        <td>
            <div class="d-flex align-items-center gap-2">
                <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">${s.fullName.charAt(0)}</div>
                <div>
                    <div style="font-weight:600;color:white">${s.fullName}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">${s.email||''}</div>
                </div>
            </div>
        </td>
        <td>${s.phone}</td>
        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.school||'-'}</td>
        <td>${s.alYear||'-'}</td>
        <td>${s.intakeSource ? `<span style="background:rgba(102,126,234,0.1);color:var(--primary);padding:3px 8px;border-radius:6px;font-size:0.72rem;">${s.intakeSource}</span>` : '-'}</td>
        <td>${statusBadge(s.isActive ? 'ACTIVE' : 'INACTIVE')}</td>
        <td>
            <div class="d-flex gap-1">
                <button class="btn btn-edit-custom btn-sm" onclick="viewStudent(${s.id})" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn btn-edit-custom btn-sm" onclick="editStudent(${s.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger-custom btn-sm" onclick="deleteStudent(${s.id},'${s.fullName}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function filterStudents() {
    const search = document.getElementById('studentSearch')?.value.toLowerCase() || '';
    const gender = document.getElementById('genderFilter')?.value || '';
    let filtered = window._allStudents || [];
    if (search) filtered = filtered.filter(s =>
        s.fullName.toLowerCase().includes(search) ||
        s.phone.includes(search) ||
        (s.studentId||'').toLowerCase().includes(search));
    if (gender) filtered = filtered.filter(s => s.gender === gender);
    document.getElementById('studentsBody').innerHTML = renderStudentRows(filtered);
}

function todayIso() {
    return new Date().toISOString().split('T')[0];
}

function normalizePhoneInput(value) {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
}

function enforceTenDigitInput(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const clamp = () => {
        el.value = normalizePhoneInput(el.value).slice(0, 11);
    };
    el.addEventListener('input', clamp);
    el.addEventListener('paste', () => setTimeout(clamp, 0));
    clamp();
}

function bindStudentPhoneGuards() {
    enforceTenDigitInput('sPhone');
    enforceTenDigitInput('sParentPhone');
    enforceTenDigitInput('esPhone');
    enforceTenDigitInput('esParentPhone');
}

function showAddStudent() {
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Full Name *</label><input type="text" class="form-control" id="sFullName" required></div>
        <div class="col-md-6"><label class="form-label">Gender *</label>
            <select class="form-select" id="sGender">
                <option value="MALE">Male</option><option value="FEMALE">Female</option>
            </select></div>
        <div class="col-md-6"><label class="form-label">Phone *</label><input type="text" class="form-control" id="sPhone" inputmode="numeric" maxlength="11" pattern="[0-9]{10,11}"></div>
        <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" id="sEmail"></div>
        <div class="col-md-6"><label class="form-label">Date of Birth</label><input type="date" class="form-control" id="sDob" max="${todayIso()}"></div>
        <div class="col-md-6"><label class="form-label">A/L Year</label><input type="number" class="form-control" id="sAlYear" min="2020" max="2030"></div>
        <div class="col-md-6"><label class="form-label">School / Institution</label><input type="text" class="form-control" id="sSchool"></div>
        <div class="col-md-6"><label class="form-label">Intake Source</label>
            <select class="form-select" id="sSource">
                <option value="">Select Source</option>
                <option>Facebook</option><option>Instagram</option><option>YouTube</option>
                <option>WhatsApp</option><option>Friend Referral</option><option>School Notice</option>
                <option>Poster/Banner</option><option>TikTok</option><option>Other</option>
            </select></div>
        <div class="col-md-6"><label class="form-label">Parent Name</label><input type="text" class="form-control" id="sParentName"></div>
        <div class="col-md-6"><label class="form-label">Parent Phone</label><input type="text" class="form-control" id="sParentPhone" inputmode="numeric" maxlength="11" pattern="[0-9]{10,11}"></div>
        <div class="col-12"><label class="form-label">Address</label><textarea class="form-control" id="sAddress" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-user-plus me-2"></i>Add New Student', form, saveNewStudent);
    bindStudentPhoneGuards();
}

async function saveNewStudent() {
    const phoneRegex = /^[0-9]{10,11}$/;
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;

    const payload = {
        fullName:    document.getElementById('sFullName').value.trim(),
        gender:      document.getElementById('sGender').value,
        phone:       normalizePhoneInput(document.getElementById('sPhone').value),
        email:       document.getElementById('sEmail').value.trim(),
        dateOfBirth: document.getElementById('sDob').value || null,
        alYear:      document.getElementById('sAlYear').value || null,
        school:      document.getElementById('sSchool').value.trim(),
        intakeSource:document.getElementById('sSource').value,
        parentName:  document.getElementById('sParentName').value.trim(),
        parentPhone: normalizePhoneInput(document.getElementById('sParentPhone').value),
        address:     document.getElementById('sAddress').value.trim(),
    };
    if (!payload.fullName || payload.fullName.length < 3 || !payload.phone) {
        return toast('Full name and phone are required', 'warning');
    }
    if (!phoneRegex.test(payload.phone)) return toast('Phone number must be 10 or 11 digits', 'warning');
    if (payload.email && !emailRegex.test(payload.email)) return toast('Enter valid email', 'warning');
    if (payload.parentPhone && !phoneRegex.test(payload.parentPhone)) return toast('Parent phone must be 10 or 11 digits', 'warning');
    if (payload.alYear && (Number(payload.alYear) < 2000 || Number(payload.alYear) > 2100)) {
        return toast('A/L year must be between 2000 and 2100', 'warning');
    }
    if (payload.dateOfBirth && payload.dateOfBirth > todayIso()) {
        return toast('Date of birth cannot be in the future', 'warning');
    }
    try {
        await api('/students', 'POST', payload);
        closeModal();
        toast('Student added successfully!');
        renderStudents();
    } catch (err) { showError(err.message); }
}

async function viewStudent(id) {
    try {
        const [s, enrollments, results] = await Promise.all([
            api(`/students/${id}`),
            api(`/students/${id}/batches`),
            api(`/students/${id}/results`)
        ]);
        const html = `
        <div class="row g-3">
            <div class="col-md-3 text-center">
                <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:700;margin:0 auto 12px;">${s.fullName.charAt(0)}</div>
                <h6 class="text-white mb-0">${s.fullName}</h6>
                <div style="color:var(--text-muted);font-size:0.8rem;">${s.studentId}</div>
                ${statusBadge(s.isActive ? 'ACTIVE' : 'INACTIVE')}
            </div>
            <div class="col-md-9">
                <div class="row g-2 mb-3">
                    <div class="col-6"><small style="color:var(--text-muted)">Phone</small><div style="color:white;font-weight:500">${s.phone}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Email</small><div style="color:white;font-weight:500">${s.email||'-'}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">School</small><div style="color:white;font-weight:500">${s.school||'-'}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">A/L Year</small><div style="color:white;font-weight:500">${s.alYear||'-'}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Parent</small><div style="color:white;font-weight:500">${s.parentName||'-'} ${s.parentPhone?'('+s.parentPhone+')':''}</div></div>
                    <div class="col-6"><small style="color:var(--text-muted)">Intake Source</small><div style="color:var(--primary);font-weight:500">${s.intakeSource||'-'}</div></div>
                </div>
                <div class="mb-2"><small style="color:var(--text-muted)">Enrolled Batches (${enrollments.length})</small></div>
                ${enrollments.map(e => `<span style="background:rgba(102,126,234,0.1);color:var(--primary);padding:4px 10px;border-radius:8px;font-size:0.78rem;margin:2px;display:inline-block;">${e.batch?.batchName||''}</span>`).join('')||'<span style="color:var(--text-muted)">No batches</span>'}
            </div>
        </div>
        ${results.length ? `
        <hr class="divider mt-3">
        <small style="color:var(--text-muted)" class="d-block mb-2">Recent Results</small>
        <div class="row g-2">
            ${results.slice(0,4).map(r => `
            <div class="col-6 col-md-3">
                <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:800;color:${gradeColor(r.grade)}">${r.grade||'-'}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">${r.examName}</div>
                    <div style="font-size:0.8rem;color:white">${r.marksObtained||0}/${r.totalMarks||0}</div>
                </div>
            </div>`).join('')}
        </div>` : ''}`;
        openModal(`<i class="fas fa-user me-2"></i>${s.fullName}`, html, null);
    } catch (err) { showError(err.message); }
}

async function editStudent(id) {
    try {
        const s = await api(`/students/${id}`);
        const form = `
        <div class="row g-3">
            <input type="hidden" id="editStudentId" value="${id}">
            <div class="col-md-6"><label class="form-label">Full Name *</label><input class="form-control" id="esFullName" value="${s.fullName}"></div>
            <div class="col-md-6"><label class="form-label">Phone *</label><input class="form-control" id="esPhone" value="${s.phone}" inputmode="numeric" maxlength="11" pattern="[0-9]{10,11}"></div>
            <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" id="esEmail" value="${s.email||''}"></div>
            <div class="col-md-6"><label class="form-label">School</label><input class="form-control" id="esSchool" value="${s.school||''}"></div>
            <div class="col-md-6"><label class="form-label">Date of Birth</label><input class="form-control" id="esDob" type="date" value="${s.dateOfBirth||''}" max="${todayIso()}"></div>
            <div class="col-md-6"><label class="form-label">A/L Year</label><input class="form-control" id="esAlYear" type="number" value="${s.alYear||''}"></div>
            <div class="col-md-6"><label class="form-label">Intake Source</label>
                <select class="form-select" id="esSource">
                    <option value="">Select</option>
                    ${['Facebook','Instagram','YouTube','WhatsApp','Friend Referral','School Notice','Poster/Banner','TikTok','Other']
                      .map(o=>`<option ${s.intakeSource===o?'selected':''}>${o}</option>`).join('')}
                </select></div>
            <div class="col-md-6"><label class="form-label">Parent Name</label><input class="form-control" id="esParentName" value="${s.parentName||''}"></div>
            <div class="col-md-6"><label class="form-label">Parent Phone</label><input class="form-control" id="esParentPhone" value="${s.parentPhone||''}" inputmode="numeric" maxlength="11" pattern="[0-9]{10,11}"></div>
        </div>`;
        openModal('<i class="fas fa-edit me-2"></i>Edit Student', form, saveEditStudent);
        bindStudentPhoneGuards();
    } catch (err) { showError(err.message); }
}

async function saveEditStudent() {
    const phoneRegex = /^[0-9]{10,11}$/;
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;

    const id = document.getElementById('editStudentId').value;
    const payload = {
        fullName:     document.getElementById('esFullName').value.trim(),
        phone:        normalizePhoneInput(document.getElementById('esPhone').value),
        email:        document.getElementById('esEmail').value.trim(),
        school:       document.getElementById('esSchool').value.trim(),
        dateOfBirth:  document.getElementById('esDob').value || null,
        alYear:       document.getElementById('esAlYear').value||null,
        intakeSource: document.getElementById('esSource').value,
        parentName:   document.getElementById('esParentName').value.trim(),
        parentPhone:  normalizePhoneInput(document.getElementById('esParentPhone').value),
    };
    if (!payload.fullName || payload.fullName.length < 3 || !payload.phone) {
        return toast('Full name and phone are required', 'warning');
    }
    if (!phoneRegex.test(payload.phone)) return toast('Phone number must be 10 or 11 digits', 'warning');
    if (payload.email && !emailRegex.test(payload.email)) return toast('Enter valid email', 'warning');
    if (payload.parentPhone && !phoneRegex.test(payload.parentPhone)) return toast('Parent phone must be 10 or 11 digits', 'warning');
    if (payload.alYear && (Number(payload.alYear) < 2000 || Number(payload.alYear) > 2100)) {
        return toast('A/L year must be between 2000 and 2100', 'warning');
    }
    if (payload.dateOfBirth && payload.dateOfBirth > todayIso()) {
        return toast('Date of birth cannot be in the future', 'warning');
    }
    try {
        await api(`/students/${id}`, 'PUT', payload);
        closeModal();
        toast('Student updated!');
        renderStudents();
    } catch (err) { showError(err.message); }
}

function deleteStudent(id, name) {
    confirmDelete(`Delete student "${name}"? This will permanently remove the row.`, async () => {
        try {
            await api(`/students/${id}`, 'DELETE');
            toast('Student deleted!');
            renderStudents();
        } catch (err) { showError(err.message); }
    });
}

// ======== BATCHES ========
async function renderBatches() {
    try {
        const [batches, subjects] = await Promise.all([api('/batches'), api('/batches/subjects')]);
        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-layer-group me-2 text-primary-custom"></i>Batch Management</h4>
            <button class="btn btn-primary-custom" onclick="showAddBatch()">
                <i class="fas fa-plus me-2"></i>Add Batch
            </button>
        </div>
        <div class="row g-4">
            ${batches.map(b => batchCard(b)).join('')}
            ${!batches.length ? '<div class="col-12"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-layer-group"></i></div><p class="empty-state-text">No batches yet</p></div></div>' : ''}
        </div>`;
        window._subjects = subjects;
    } catch (err) { showError(err.message); }
}

function batchCard(b) {
    return `
    <div class="col-md-6 col-xl-4">
        <div class="card h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 style="color:white;font-weight:700;margin:0">${b.batchName}</h6>
                        <small style="color:var(--text-muted)">${b.subject?.name||'No Subject'} | ${b.medium}</small>
                    </div>
                    <span style="background:rgba(102,126,234,0.1);color:var(--primary);padding:4px 10px;border-radius:8px;font-size:0.75rem;font-weight:600;">${b.year}</span>
                </div>
                <div class="row g-2 mb-3 text-center">
                    <div class="col-6" style="background:rgba(255,255,255,0.03);border-radius:8px;padding:10px;">
                        <div style="font-size:1.2rem;font-weight:700;color:white">${b.maxStudents}</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">Max Students</div>
                    </div>
                    <div class="col-6" style="background:rgba(0,176,155,0.06);border-radius:8px;padding:10px;">
                        <div style="font-size:1.2rem;font-weight:700;color:#00b09b">Rs.${numFmt(b.feeAmount)}</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">Monthly Fee</div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-edit-custom btn-sm flex-fill" onclick="editBatch(${b.id})"><i class="fas fa-edit me-1"></i>Edit</button>
                    <button class="btn btn-danger-custom btn-sm flex-fill" onclick="deleteBatch(${b.id},'${b.batchName}')"><i class="fas fa-trash me-1"></i>Delete</button>
                </div>
            </div>
        </div>
    </div>`;
}

async function showAddBatch() {
    const subjects = window._subjects || await api('/batches/subjects');
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Batch Name *</label><input class="form-control" id="bName"></div>
        <div class="col-md-6"><label class="form-label">Subject</label>
            <select class="form-select" id="bSubject">
                <option value="">Select Subject</option>
                ${subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
            </select></div>
        <div class="col-md-4"><label class="form-label">Year *</label><input class="form-control" id="bYear" type="number" value="${new Date().getFullYear()}"></div>
        <div class="col-md-4"><label class="form-label">Medium</label>
            <select class="form-select" id="bMedium"><option>SINHALA</option><option>TAMIL</option><option>ENGLISH</option></select></div>
        <div class="col-md-4"><label class="form-label">Max Students</label><input class="form-control" id="bMax" type="number" value="50"></div>
        <div class="col-md-6"><label class="form-label">Monthly Fee (Rs.) *</label><input class="form-control" id="bFee" type="number" step="0.01"></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>Add Batch', form, saveNewBatch);
}

async function saveNewBatch() {
    const payload = {
        batchName:   document.getElementById('bName').value.trim(),
        subject:     document.getElementById('bSubject').value ? { id: document.getElementById('bSubject').value } : null,
        year:        parseInt(document.getElementById('bYear').value),
        medium:      document.getElementById('bMedium').value,
        maxStudents: parseInt(document.getElementById('bMax').value),
        feeAmount:   parseFloat(document.getElementById('bFee').value),
    };
    if (!payload.batchName || !payload.year) return toast('Fill required fields','warning');
    try { await api('/batches','POST',payload); closeModal(); toast('Batch created!'); renderBatches(); }
    catch (err) { showError(err.message); }
}

async function editBatch(id) {
    const b = await api(`/batches/${id}`);
    const subjects = window._subjects || await api('/batches/subjects');
    const form = `
    <div class="row g-3">
        <input type="hidden" id="eBatchId" value="${id}">
        <div class="col-md-6"><label class="form-label">Batch Name</label><input class="form-control" id="ebName" value="${b.batchName}"></div>
        <div class="col-md-6"><label class="form-label">Subject</label>
            <select class="form-select" id="ebSubject">
                <option value="">None</option>
                ${subjects.map(s=>`<option value="${s.id}" ${b.subject?.id==s.id?'selected':''}>${s.name}</option>`).join('')}
            </select></div>
        <div class="col-md-4"><label class="form-label">Year</label><input class="form-control" id="ebYear" type="number" value="${b.year}"></div>
        <div class="col-md-4"><label class="form-label">Medium</label>
            <select class="form-select" id="ebMedium">
                ${['SINHALA','TAMIL','ENGLISH'].map(m=>`<option ${b.medium===m?'selected':''}>${m}</option>`).join('')}
            </select></div>
        <div class="col-md-4"><label class="form-label">Max Students</label><input class="form-control" id="ebMax" type="number" value="${b.maxStudents}"></div>
        <div class="col-md-6"><label class="form-label">Monthly Fee</label><input class="form-control" id="ebFee" type="number" step="0.01" value="${b.feeAmount}"></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Batch', form, async () => {
        const payload = {
            batchName: document.getElementById('ebName').value,
            year: parseInt(document.getElementById('ebYear').value),
            medium: document.getElementById('ebMedium').value,
            maxStudents: parseInt(document.getElementById('ebMax').value),
            feeAmount: parseFloat(document.getElementById('ebFee').value),
        };
        try { await api(`/batches/${id}`,'PUT',payload); closeModal(); toast('Batch updated!'); renderBatches(); }
        catch (err) { showError(err.message); }
    });
}

function deleteBatch(id, name) {
    confirmDelete(`Remove batch "${name}"?`, async () => {
        try { await api(`/batches/${id}`,'DELETE'); toast('Batch removed!'); renderBatches(); }
        catch (err) { showError(err.message); }
    });
}

// ======== ATTENDANCE ========
async function renderAttendance() {
    try {
        const [batches] = await Promise.all([api('/batches')]);
        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-clipboard-check me-2 text-primary-custom"></i>Attendance Management</h4>
        </div>
        <div class="row g-4">
            <div class="col-lg-5">
                <div class="card">
                    <div class="card-header"><h6 class="card-title">Mark Attendance</h6></div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Select Batch</label>
                            <select class="form-select" id="attBatch" onchange="loadStudentsForAttendance()">
                                <option value="">-- Select Batch --</option>
                                ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-control" id="attDate" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div id="studentAttList"></div>
                        <button class="btn btn-primary-custom w-100 mt-3" onclick="submitAttendance()" style="display:none" id="submitAttBtn">
                            <i class="fas fa-save me-2"></i>Submit Attendance
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title">Attendance Records</h6>
                        <select class="form-select" id="attViewBatch" style="width:180px;" onchange="loadAttendanceRecords()">
                            <option value="">Select Batch</option>
                            ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
                        </select>
                    </div>
                    <div class="card-body p-0" id="attRecordsArea">
                        <div class="empty-state"><div class="empty-state-icon"><i class="fas fa-clipboard"></i></div>
                        <p class="empty-state-text">Select a batch to view records</p></div>
                    </div>
                </div>
            </div>
        </div>`;
    } catch (err) { showError(err.message); }
}

async function loadStudentsForAttendance() {
    const batchId = document.getElementById('attBatch').value;
    if (!batchId) return;
    try {
        const enrollments = await api(`/batches/${batchId}/attendance`);
        const students = await api(`/students`);
        const batchStudents = students.filter(s => s.isActive);
        const listEl = document.getElementById('studentAttList');
        if (!batchStudents.length) { listEl.innerHTML = '<p style="color:var(--text-muted)">No students in batch</p>'; return; }
        listEl.innerHTML = `
        <div style="max-height:320px;overflow-y:auto;">
            ${batchStudents.map(s => `
            <div class="d-flex align-items-center justify-content-between p-2 mb-1" style="background:rgba(255,255,255,0.03);border-radius:8px;">
                <span style="font-size:0.85rem;color:white">${s.fullName}</span>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn active att-btn" style="background:rgba(0,176,155,0.2);border:1px solid rgba(0,176,155,0.3);color:#00b09b;font-size:0.7rem;"
                            data-sid="${s.id}" data-status="PRESENT" onclick="setAtt(this)">P</button>
                    <button type="button" class="btn att-btn" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:var(--text-muted);font-size:0.7rem;"
                            data-sid="${s.id}" data-status="ABSENT" onclick="setAtt(this)">A</button>
                    <button type="button" class="btn att-btn" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:var(--text-muted);font-size:0.7rem;"
                            data-sid="${s.id}" data-status="LATE" onclick="setAtt(this)">L</button>
                </div>
            </div>`).join('')}
        </div>`;
        document.getElementById('submitAttBtn').style.display = '';
        window._attStudents = batchStudents;
    } catch (err) { showError(err.message); }
}

function setAtt(btn) {
    const sid = btn.dataset.sid;
    document.querySelectorAll(`[data-sid="${sid}"]`).forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-muted)';
    });
    const colors = { PRESENT: '#00b09b', ABSENT: '#ff4757', LATE: '#ffa502' };
    btn.style.background = `rgba(${btn.dataset.status==='PRESENT'?'0,176,155':btn.dataset.status==='ABSENT'?'255,71,87':'255,165,2'},0.2)`;
    btn.style.color = colors[btn.dataset.status];
}

async function submitAttendance() {
    const batchId = document.getElementById('attBatch').value;
    const date    = document.getElementById('attDate').value;
    if (!batchId || !date) return toast('Select batch and date','warning');
    const records = [];
    (window._attStudents||[]).forEach(s => {
        const activeBtn = document.querySelector(`[data-sid="${s.id}"][data-status]`);
        const allBtns   = document.querySelectorAll(`[data-sid="${s.id}"]`);
        let status = 'PRESENT';
        allBtns.forEach(b => { if (b.style.color !== 'var(--text-muted)' && b.style.color !== '') status = b.dataset.status; });
        records.push({ student: {id:s.id}, batch:{id:parseInt(batchId)}, date, status });
    });
    try {
        await api('/attendance/bulk','POST',records);
        toast(`Attendance marked for ${records.length} students!`);
    } catch (err) { showError(err.message); }
}

async function loadAttendanceRecords() {
    const batchId = document.getElementById('attViewBatch').value;
    if (!batchId) return;
    try {
        const today   = new Date().toISOString().split('T')[0];
        const records = await api(`/attendance/batch/${batchId}/date/${today}`);
        const area = document.getElementById('attRecordsArea');
        if (!records.length) {
            area.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div><p class="empty-state-text">No attendance for today</p></div>`;
            return;
        }
        area.innerHTML = `<div class="table-responsive">
            <table class="table">
                <thead><tr><th>Student</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>${records.map(r=>`
                <tr>
                    <td style="color:white;font-weight:500">${r.student?.fullName||'-'}</td>
                    <td style="color:var(--text-muted)">${dateFmt(r.date)}</td>
                    <td>${statusBadge(r.status)}</td>
                </tr>`).join('')}</tbody>
            </table></div>`;
    } catch (err) { showError(err.message); }
}

// ======== RESULTS ========
async function renderResults() {
    try {
        const [results, batches] = await Promise.all([api('/results'), api('/batches')]);
        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-chart-line me-2 text-primary-custom"></i>Exam Results</h4>
            <button class="btn btn-primary-custom" onclick="showAddResult()">
                <i class="fas fa-plus me-2"></i>Add Result
            </button>
        </div>
        <div class="table-container">
            <div class="p-3 border-bottom border-custom">
                <select class="form-select d-inline-block" id="resultBatchFilter" style="width:200px;" onchange="filterResults()">
                    <option value="">All Batches</option>
                    ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
                </select>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Student</th><th>Exam</th><th>Type</th><th>Marks</th><th>Grade</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody id="resultsBody">
                        ${renderResultRows(results)}
                    </tbody>
                </table>
            </div>
        </div>`;
        window._allResults = results;
        window._resultBatches = batches;
    } catch (err) { showError(err.message); }
}

function renderResultRows(results) {
    if (!results.length) return `<tr><td colspan="7" class="text-center py-5" style="color:var(--text-muted)">No results found</td></tr>`;
    return results.map(r => `
    <tr>
        <td><span style="color:white;font-weight:500">${r.student?.fullName||'-'}</span><br>
            <small style="color:var(--text-muted)">${r.batch?.batchName||''}</small></td>
        <td>${r.examName}</td>
        <td><span style="background:rgba(102,126,234,0.1);color:var(--primary);padding:3px 8px;border-radius:6px;font-size:0.72rem;">${r.examType}</span></td>
        <td><span style="color:white;font-weight:600">${r.marksObtained}</span><span style="color:var(--text-muted)">/${r.totalMarks}</span>
            <div class="custom-progress mt-1"><div class="custom-progress-bar" style="width:${(r.marksObtained/r.totalMarks*100).toFixed(0)}%"></div></div>
        </td>
        <td><span style="font-size:1.4rem;font-weight:800;color:${gradeColor(r.grade)}">${r.grade||'-'}</span></td>
        <td style="color:var(--text-muted)">${dateFmt(r.examDate)}</td>
        <td>
            <div class="d-flex gap-1">
                <button class="btn btn-edit-custom btn-sm" onclick="editResult(${r.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger-custom btn-sm" onclick="deleteResult(${r.id})"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function filterResults() {
    const batchId = document.getElementById('resultBatchFilter').value;
    const filtered = batchId ? (window._allResults||[]).filter(r=>r.batch?.id==batchId) : window._allResults;
    document.getElementById('resultsBody').innerHTML = renderResultRows(filtered||[]);
}

async function showAddResult() {
    const [batches, students] = await Promise.all([api('/batches'), api('/students')]);
    const today = new Date().toISOString().split('T')[0];
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Student *</label>
            <select class="form-select" id="rStudent">
                <option value="">Select Student</option>
                ${students.map(s=>`<option value="${s.id}">${s.fullName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Batch *</label>
            <select class="form-select" id="rBatch">
                <option value="">Select Batch</option>
                ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Exam Name *</label><input class="form-control" id="rExamName"></div>
        <div class="col-md-6"><label class="form-label">Exam Type</label>
            <select class="form-select" id="rExamType">
                <option>MONTHLY_TEST</option><option>TERM_TEST</option><option>MOCK_EXAM</option><option>FINAL</option>
            </select></div>
        <div class="col-md-4"><label class="form-label">Marks Obtained * (0-100)</label><input class="form-control" id="rMarks" type="number" min="0" max="100" step="1"></div>
        <div class="col-md-4"><label class="form-label">Total Marks *</label><input class="form-control" id="rTotal" type="number" value="100" min="100" max="100" step="1" readonly></div>
        <div class="col-md-4"><label class="form-label">Exam Date</label><input class="form-control" id="rDate" type="date" max="${today}"></div>
        <div class="col-12"><label class="form-label">Remarks</label><textarea class="form-control" id="rRemarks" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>Add Result', form, async () => {
        const marksRaw = document.getElementById('rMarks').value;
        const totalRaw = document.getElementById('rTotal').value || '100';
        const examDate = document.getElementById('rDate').value || null;

        const payload = {
            student: { id: parseInt(document.getElementById('rStudent').value) },
            batch:   { id: parseInt(document.getElementById('rBatch').value) },
            examName: document.getElementById('rExamName').value,
            examType: document.getElementById('rExamType').value,
            marksObtained: parseInt(marksRaw, 10),
            totalMarks:    parseInt(totalRaw, 10),
            examDate,
            remarks:       document.getElementById('rRemarks').value,
        };

        if (!payload.student.id || !payload.batch.id || !payload.examName?.trim()) {
            return toast('Student, batch and exam name are required', 'warning');
        }
        if (!Number.isInteger(payload.marksObtained) || payload.marksObtained < 0 || payload.marksObtained > 100) {
            return toast('Marks obtained must be a whole number between 0 and 100', 'warning');
        }
        if (payload.totalMarks !== 100) {
            return toast('Total marks must be 100', 'warning');
        }
        if (examDate && examDate > today) {
            return toast('Exam date cannot be in the future', 'warning');
        }

        try { await api('/results','POST',payload); closeModal(); toast('Result added!'); renderResults(); }
        catch(err) { showError(err.message); }
    });
}

async function editResult(id) {
    const r = await api(`/results/${id}`);
    const today = new Date().toISOString().split('T')[0];
    const form = `
    <input type="hidden" id="eResultId" value="${id}">
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Exam Name</label><input class="form-control" id="erExamName" value="${r.examName}"></div>
        <div class="col-md-3"><label class="form-label">Marks Obtained</label><input class="form-control" id="erMarks" type="number" min="0" max="100" step="1" value="${r.marksObtained}"></div>
        <div class="col-md-3"><label class="form-label">Total Marks</label><input class="form-control" id="erTotal" type="number" value="100" min="100" max="100" step="1" readonly></div>
        <div class="col-md-6"><label class="form-label">Exam Date</label><input class="form-control" id="erDate" type="date" max="${today}" value="${r.examDate||''}"></div>
        <div class="col-12"><label class="form-label">Remarks</label><textarea class="form-control" id="erRemarks" rows="2">${r.remarks||''}</textarea></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Result', form, async () => {
        const marks = parseInt(document.getElementById('erMarks').value, 10);
        const total = parseInt(document.getElementById('erTotal').value || '100', 10);
        const examDate = document.getElementById('erDate').value || null;

        const payload = {
            student: { id: r.student?.id },
            batch: { id: r.batch?.id },
            examName: document.getElementById('erExamName').value,
            examType: r.examType,
            marksObtained: marks,
            totalMarks: total,
            examDate,
            remarks: document.getElementById('erRemarks').value,
        };

        if (!payload.examName?.trim()) {
            return toast('Exam name is required', 'warning');
        }
        if (!Number.isInteger(payload.marksObtained) || payload.marksObtained < 0 || payload.marksObtained > 100) {
            return toast('Marks obtained must be a whole number between 0 and 100', 'warning');
        }
        if (payload.totalMarks !== 100) {
            return toast('Total marks must be 100', 'warning');
        }
        if (examDate && examDate > today) {
            return toast('Exam date cannot be in the future', 'warning');
        }

        try { await api(`/results/${id}`,'PUT',payload); closeModal(); toast('Result updated!'); renderResults(); }
        catch(err) { showError(err.message); }
    });
}

function deleteResult(id) {
    confirmDelete('Delete this result record?', async () => {
        try { await api(`/results/${id}`,'DELETE'); toast('Result deleted!'); renderResults(); }
        catch(err) { showError(err.message); }
    });
}
