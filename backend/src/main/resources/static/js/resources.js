/* ============================================
   resources.js - Resource & Learning Materials
   ============================================ */

async function renderResources() {
    try {
        const resources = await api('/resources');

        const typeIcons = {
            PDF:         { icon:'fas fa-file-pdf',    color:'#ff4757' },
            PPT:         { icon:'fas fa-file-powerpoint', color:'#ff6b35' },
            DOC:         { icon:'fas fa-file-word',   color:'#1877f2' },
            VIDEO:       { icon:'fas fa-video',       color:'#e84393' },
            MODEL_PAPER: { icon:'fas fa-file-alt',    color:'#ffa502' },
            OTHER:       { icon:'fas fa-file',        color:'#8892a4' },
        };

        const counts = {};
        resources.forEach(r => {
            const type = getResourceType(r);
            counts[type] = (counts[type] || 0) + 1;
        });

        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-book-open me-2 text-primary-custom"></i>Resources & Learning Materials</h4>
            <button class="btn btn-primary-custom" onclick="showUploadResource()">
                <i class="fas fa-upload me-2"></i>Upload Resource
            </button>
        </div>

        <div class="row g-3 mb-4">
            ${Object.entries(typeIcons).map(([type, {icon, color}]) => `
            <div class="col">
                <div class="stat-card" style="--stat-color:${color};--stat-bg:${color}18;cursor:pointer;" onclick="filterByType('${type}')">
                    <div class="stat-icon"><i class="${icon}"></i></div>
                    <div><div class="stat-value">${counts[type]||0}</div><div class="stat-label">${type.replace('_',' ')}</div></div>
                </div>
            </div>`).join('')}
            <div class="col">
                <div class="stat-card" style="--stat-color:#667eea;--stat-bg:rgba(102,126,234,0.1);cursor:pointer;" onclick="filterByType('ALL')">
                    <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                    <div><div class="stat-value">${resources.length}</div><div class="stat-label">Total</div></div>
                </div>
            </div>
        </div>

        <div class="d-flex gap-2 mb-3 flex-wrap">
            <div class="search-bar flex-grow-1">
                <i class="fas fa-search"></i>
                <input type="text" class="form-control" id="resSearch" placeholder="Search resources..." oninput="filterResources()">
            </div>
            <select class="form-select" id="resTypeFilter" style="width:160px;" onchange="filterResources()">
                <option value="ALL">All Types</option>
                ${Object.keys(typeIcons).map(t=>`<option value="${t}">${t.replace('_',' ')}</option>`).join('')}
            </select>
        </div>

        <div class="row g-3" id="resourcesGrid">
            ${renderResourceCards(resources, typeIcons)}
        </div>`;

        window._allResources = resources;
        window._typeIcons    = typeIcons;

    } catch(err) { showError(err.message); }
}

function renderResourceCards(resources, typeIcons) {
    if (!resources.length) return `
    <div class="col-12">
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-folder-open"></i></div>
            <p class="empty-state-text">No resources found. Upload your first resource!</p>
        </div>
    </div>`;

    return resources.map(r => {
        const type = getResourceType(r);
        const { icon, color } = typeIcons[type] || typeIcons.OTHER;
        return `
        <div class="col-md-6 col-xl-4">
            <div class="card h-100 resource-card" style="border-left:3px solid ${color};">
                <div class="card-body">
                    <div class="d-flex align-items-start gap-3 mb-3">
                        <div style="width:50px;height:50px;border-radius:12px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="${icon}" style="font-size:1.4rem;color:${color};"></i>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.95rem;">${r.title}</div>
                            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${r.subject||''} ${r.uploadedAt ? '• '+dateFmt(r.uploadedAt) : ''}</div>
                        </div>
                    </div>
                    ${r.description ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${r.description}</p>` : ''}
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span style="background:${color}18;color:${color};padding:3px 8px;border-radius:6px;font-size:0.7rem;font-weight:600;">${type}</span>
                        ${r.isRestricted ? '<span style="background:rgba(255,71,87,0.1);color:#ff4757;padding:3px 8px;border-radius:6px;font-size:0.7rem;"><i class="fas fa-lock me-1"></i>Restricted</span>' : '<span style="background:rgba(0,176,155,0.1);color:#00b09b;padding:3px 8px;border-radius:6px;font-size:0.7rem;"><i class="fas fa-lock-open me-1"></i>Free</span>'}
                        ${r.fileSize ? `<span style="color:var(--text-muted);font-size:0.7rem;margin-left:auto;">${formatFileSize(r.fileSize)}</span>` : ''}
                    </div>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-sm flex-fill"
                           style="background:rgba(102,126,234,0.1);color:var(--primary);border:1px solid rgba(102,126,234,0.2);font-size:0.75rem;border-radius:8px;"
                           onclick="downloadResource(${r.id}, '${(r.fileName || 'resource').replace(/'/g,"\\'")}')">
                            <i class="fas fa-download me-1"></i>Download
                        </button>
                        <button class="btn btn-edit-custom btn-sm" onclick="editResource(${r.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger-custom btn-sm" onclick="deleteResource(${r.id},'${r.title.replace(/'/g,"\\'")}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function filterByType(type) {
    document.getElementById('resTypeFilter').value = type === 'ALL' ? 'ALL' : type;
    filterResources();
}

function filterResources() {
    const search = document.getElementById('resSearch')?.value.toLowerCase() || '';
    const type   = document.getElementById('resTypeFilter')?.value || 'ALL';
    let filtered = window._allResources || [];
    if (type !== 'ALL') filtered = filtered.filter(r => getResourceType(r) === type);
    if (search) filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(search) ||
        (r.description||'').toLowerCase().includes(search) ||
        (r.subject||'').toLowerCase().includes(search));
    document.getElementById('resourcesGrid').innerHTML = renderResourceCards(filtered, window._typeIcons||{});
}

function showUploadResource() {
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Title *</label><input class="form-control" id="rTitle"></div>
        <div class="col-md-6"><label class="form-label">File Type *</label>
            <select class="form-select" id="rType">
                <option>PDF</option><option>PPT</option><option>DOC</option><option>VIDEO</option><option>MODEL_PAPER</option><option>OTHER</option>
            </select></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="rDesc" rows="2"></textarea></div>
        <div class="col-md-6"><label class="form-label">Subject</label><input class="form-control" id="rSubject"></div>
        <div class="col-md-6 d-flex align-items-end">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="rRestricted">
                <label class="form-check-label" style="color:var(--text-muted)">Restrict to paid students only</label>
            </div>
        </div>
        <div class="col-12">
            <label class="form-label">File *</label>
            <div id="dropZone" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:30px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(102,126,234,0.04);"
                 onclick="document.getElementById('rFile').click()"
                 ondrop="handleFileDrop(event)" ondragover="event.preventDefault();this.style.borderColor='#667eea';"
                 ondragleave="this.style.borderColor='rgba(102,126,234,0.3)'">
                <i class="fas fa-cloud-upload-alt" style="font-size:2rem;color:var(--primary);margin-bottom:8px;display:block;"></i>
                <p style="color:var(--text-muted);margin:0;font-size:0.85rem;">Drag & drop file here, or <span style="color:var(--primary)">click to browse</span></p>
                <div id="fileNameDisplay" style="margin-top:8px;color:white;font-size:0.8rem;"></div>
            </div>
            <input type="file" id="rFile" style="display:none;" onchange="showFileName(this)">
        </div>
    </div>`;
    openModal('<i class="fas fa-upload me-2"></i>Upload Resource', form, uploadResource);
}

function showFileName(input) {
    const name = input.files[0]?.name || '';
    document.getElementById('fileNameDisplay').textContent = name ? `Selected: ${name}` : '';
    document.getElementById('dropZone').style.borderColor = name ? '#00b09b' : 'rgba(102,126,234,0.3)';
}

function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
        const input = document.getElementById('rFile');
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        showFileName(input);
    }
}

async function uploadResource() {
    const title      = document.getElementById('rTitle').value.trim();
    const fileType   = document.getElementById('rType').value;
    const fileInput  = document.getElementById('rFile');

    if (!title) return toast('Enter title','warning');
    if (!fileInput.files[0]) return toast('Please choose a file to upload','warning');

    const formData = new FormData();
    formData.append('title',      title);
    formData.append('type',       fileType);
    formData.append('description', document.getElementById('rDesc').value);
    formData.append('subject',    document.getElementById('rSubject').value);
    formData.append('restricted', document.getElementById('rRestricted').checked);
    if (fileInput.files[0]) formData.append('file', fileInput.files[0]);

    try {
        await apiUpload('/resources/upload', formData);
        closeModal();
        toast('Resource uploaded!');
        renderResources();
    } catch(err) { showError(err.message); }
}

async function editResource(id) {
    const r = await api(`/resources/${id}`);
    const form = `
    <div class="row g-3">
        <input type="hidden" id="editResId" value="${id}">
        <div class="col-md-6"><label class="form-label">Title</label><input class="form-control" id="erTitle" value="${r.title}"></div>
        <div class="col-md-6"><label class="form-label">Type</label>
            <select class="form-select" id="erType">
                ${['PDF','PPT','DOC','VIDEO','MODEL_PAPER','OTHER'].map(t=>`<option ${getResourceType(r)===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="erDesc" rows="2">${r.description||''}</textarea></div>
        <div class="col-md-6"><label class="form-label">Subject</label><input class="form-control" id="erSubject" value="${r.subject||''}"></div>
        <div class="col-md-6 d-flex align-items-end">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="erRestricted" ${r.isRestricted?'checked':''}>
                <label class="form-check-label" style="color:var(--text-muted)">Restricted</label>
            </div>
        </div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Resource', form, async() => {
        const payload = {
            title:        document.getElementById('erTitle').value,
            resourceType: document.getElementById('erType').value,
            description:  document.getElementById('erDesc').value,
            isRestricted: document.getElementById('erRestricted').checked,
        };
        try { await api(`/resources/${id}`,'PUT',payload); closeModal(); toast('Resource updated!'); renderResources(); }
        catch(err) { showError(err.message); }
    });
}

function deleteResource(id, title) {
    confirmDelete(`Delete resource "${title}"?`, async() => {
        try { await api(`/resources/${id}`,'DELETE'); toast('Resource deleted!'); renderResources(); }
        catch(err) { showError(err.message); }
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + 'KB';
    return (bytes/1048576).toFixed(1) + 'MB';
}

async function downloadResource(id, fileName) {
    try {
        const token = (typeof getAuthToken === 'function' ? getAuthToken() : localStorage.getItem('token'));
        if (!token) {
            toast('Session expired. Please login again.', 'warning');
            if (typeof logout === 'function') logout();
            return;
        }

        const res = await fetch(`${API}/resources/${id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            toast('Session expired. Please login again.', 'warning');
            if (typeof logout === 'function') logout();
            return;
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Download failed: ${res.status}`);
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `resource-${id}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        showError(err.message || 'Download failed');
    }
}

function getResourceType(resource) {
    return resource?.resourceType || resource?.fileType || 'OTHER';
}
