/* ============================================
   marketing.js - Marketing Management Module
   ============================================ */

async function renderMarketing() {
    try {
        const [campaigns, intakeSourcesRaw] = await Promise.all([
            api('/marketing/campaigns'),
            api('/marketing/intake-sources')
        ]);
        const intakeSources = normalizeIntakeSources(intakeSourcesRaw);

        const active   = campaigns.filter(c => c.status === 'ACTIVE').length;
        const totalBudget = campaigns.reduce((s,c) => s + (c.budget||0), 0);

        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-bullhorn me-2 text-primary-custom"></i>Marketing Management</h4>
            <button class="btn btn-primary-custom" onclick="showAddCampaign()">
                <i class="fas fa-plus me-2"></i>New Campaign
            </button>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#667eea; --stat-bg:rgba(102,126,234,0.1)">
                    <div class="stat-icon"><i class="fas fa-bullhorn"></i></div>
                    <div><div class="stat-value">${campaigns.length}</div><div class="stat-label">Total Campaigns</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#00b09b; --stat-bg:rgba(0,176,155,0.1)">
                    <div class="stat-icon"><i class="fas fa-play-circle"></i></div>
                    <div><div class="stat-value">${active}</div><div class="stat-label">Active</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#ffa502; --stat-bg:rgba(255,165,2,0.1)">
                    <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                    <div><div class="stat-value">Rs.${numFmt(totalBudget)}</div><div class="stat-label">Total Budget</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#e84393; --stat-bg:rgba(232,67,147,0.1)">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div><div class="stat-value">${intakeSources.reduce((s,i)=>s+(i.count||0),0)}</div><div class="stat-label">Total Intakes</div></div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-5">
                <div class="card h-100">
                    <div class="card-header"><h6 class="card-title"><i class="fas fa-chart-pie me-2 text-primary-custom"></i>Student Intake Sources</h6></div>
                    <div class="card-body">
                        <canvas id="intakeDetailChart" height="200"></canvas>
                        <div class="mt-3" id="intakeLegend"></div>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="card h-100">
                    <div class="card-header"><h6 class="card-title"><i class="fas fa-chart-bar me-2 text-primary-custom"></i>Platform Breakdown</h6></div>
                    <div class="card-body"><canvas id="platformChart" height="160"></canvas></div>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="p-3 border-bottom border-custom d-flex gap-2 align-items-center">
                <h6 style="margin:0;color:white;">Campaign List</h6>
                <select class="form-select ms-auto" id="campPlatformFilter" style="width:160px;" onchange="filterCampaigns()">
                    <option value="">All Platforms</option>
                    ${['FACEBOOK','INSTAGRAM','YOUTUBE','TIKTOK','WHATSAPP','REFERRAL','POSTER','OTHER']
                      .map(p=>`<option>${p}</option>`).join('')}
                </select>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Campaign</th><th>Platform</th><th>Budget</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody id="campaignsBody">${renderCampaignRows(campaigns)}</tbody>
                </table>
            </div>
        </div>`;

        window._allCampaigns  = campaigns;
        window._intakeSources = intakeSources;

        setTimeout(() => {
            buildIntakeDetailChart(intakeSources);
            buildPlatformChart(campaigns);
        }, 100);

    } catch(err) { showError(err.message); }
}

function normalizeIntakeSources(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).map(([source, count]) => ({
        source,
        count: Number(count) || 0
    }));
}

function renderCampaignRows(campaigns) {
    if (!campaigns.length) return `<tr><td colspan="7" class="text-center py-5" style="color:var(--text-muted)">No campaigns</td></tr>`;
    return campaigns.map(c => `
    <tr>
        <td>
            <div style="font-weight:600;color:white">${c.campaignName}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">${c.description||''}</div>
        </td>
        <td>${platformBadge(c.platform)}</td>
        <td style="color:#00b09b;font-weight:600">${c.budget ? 'Rs.'+numFmt(c.budget) : '-'}</td>
        <td style="color:var(--text-muted)">${dateFmt(c.startDate)}</td>
        <td style="color:var(--text-muted)">${c.endDate ? dateFmt(c.endDate) : 'Ongoing'}</td>
        <td>${statusBadge(c.status||'ACTIVE')}</td>
        <td>
            <div class="d-flex gap-1">
                <button class="btn btn-edit-custom btn-sm" onclick="editCampaign(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger-custom btn-sm" onclick="deleteCampaign(${c.id},'${c.campaignName}')"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function platformBadge(platform) {
    const colors = {
        FACEBOOK: '#1877f2', INSTAGRAM: '#e4405f', YOUTUBE: '#ff0000',
        TIKTOK: '#01f0d0', WHATSAPP: '#25d366', REFERRAL: '#00b09b',
        POSTER: '#ffa502', OTHER: '#8892a4'
    };
    const icons = {
        FACEBOOK: 'fab fa-facebook', INSTAGRAM: 'fab fa-instagram', YOUTUBE: 'fab fa-youtube',
        TIKTOK: 'fab fa-tiktok', WHATSAPP: 'fab fa-whatsapp', REFERRAL: 'fas fa-user-friends',
        POSTER: 'fas fa-image', OTHER: 'fas fa-globe'
    };
    const color = colors[platform] || '#8892a4';
    const icon  = icons[platform]  || 'fas fa-globe';
    return `<span style="background:${color}22;color:${color};padding:4px 10px;border-radius:8px;font-size:0.75rem;font-weight:600;white-space:nowrap;">
        <i class="${icon} me-1"></i>${platform}
    </span>`;
}

function filterCampaigns() {
    const platform = document.getElementById('campPlatformFilter').value;
    const filtered = platform ? (window._allCampaigns||[]).filter(c => c.platform === platform) : window._allCampaigns;
    document.getElementById('campaignsBody').innerHTML = renderCampaignRows(filtered||[]);
}

async function showAddCampaign() {
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Campaign Name *</label><input class="form-control" id="cName"></div>
        <div class="col-md-6"><label class="form-label">Platform *</label>
            <select class="form-select" id="cPlatform">
                ${['FACEBOOK','INSTAGRAM','YOUTUBE','TIKTOK','WHATSAPP','REFERRAL','POSTER','OTHER'].map(p=>`<option>${p}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Budget (Rs.)</label><input class="form-control" id="cBudget" type="number" step="0.01"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="cStatus"><option>ACTIVE</option><option>COMPLETED</option><option>PAUSED</option><option>PLANNED</option></select></div>
        <div class="col-md-6"><label class="form-label">Start Date</label><input class="form-control" id="cStart" type="date"></div>
        <div class="col-md-6"><label class="form-label">End Date</label><input class="form-control" id="cEnd" type="date"></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="cDesc" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>New Campaign', form, async () => {
        const payload = {
            campaignName: document.getElementById('cName').value.trim(),
            platform:     document.getElementById('cPlatform').value,
            budget:       document.getElementById('cBudget').value ? parseFloat(document.getElementById('cBudget').value) : null,
            status:       document.getElementById('cStatus').value,
            startDate:    document.getElementById('cStart').value||null,
            endDate:      document.getElementById('cEnd').value||null,
            description:  document.getElementById('cDesc').value,
        };
        if (!payload.campaignName) return toast('Enter campaign name','warning');
        if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
            return toast('End date cannot be before start date', 'warning');
        }
        try { await api('/marketing/campaigns','POST',payload); closeModal(); toast('Campaign created!'); renderMarketing(); }
        catch(err) { showError(err.message); }
    });
}

async function editCampaign(id) {
    const c = await api(`/marketing/campaigns/${id}`);
    const form = `
    <div class="row g-3">
        <input type="hidden" id="editCampId" value="${id}">
        <div class="col-md-6"><label class="form-label">Campaign Name</label><input class="form-control" id="ecName" value="${c.campaignName}"></div>
        <div class="col-md-6"><label class="form-label">Platform</label>
            <select class="form-select" id="ecPlatform">
                ${['FACEBOOK','INSTAGRAM','YOUTUBE','TIKTOK','WHATSAPP','REFERRAL','POSTER','OTHER']
                  .map(p=>`<option ${c.platform===p?'selected':''}>${p}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Budget</label><input class="form-control" id="ecBudget" type="number" value="${c.budget||''}"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="ecStatus">
                ${['ACTIVE','COMPLETED','PAUSED','PLANNED'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" id="ecDesc" rows="2">${c.description||''}</textarea></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Campaign', form, async () => {
        const payload = {
            campaignName: document.getElementById('ecName').value,
            platform: document.getElementById('ecPlatform').value,
            budget: document.getElementById('ecBudget').value ? parseFloat(document.getElementById('ecBudget').value) : null,
            status: document.getElementById('ecStatus').value,
            description: document.getElementById('ecDesc').value,
        };
        try { await api(`/marketing/campaigns/${id}`,'PUT',payload); closeModal(); toast('Campaign updated!'); renderMarketing(); }
        catch(err) { showError(err.message); }
    });
}

function deleteCampaign(id, name) {
    confirmDelete(`Delete campaign "${name}"?`, async() => {
        try { await api(`/marketing/campaigns/${id}`,'DELETE'); toast('Campaign deleted!'); renderMarketing(); }
        catch(err) { showError(err.message); }
    });
}

function buildIntakeDetailChart(sources) {
    const ctx = document.getElementById('intakeDetailChart');
    if (!ctx || !sources.length) return;
    const colors = ['#667eea','#00b09b','#ffa502','#ff4757','#e84393','#1877f2','#25d366','#ff9f43','#a29bfe'];
    if (window._intakeDetailChartInst) window._intakeDetailChartInst.destroy();
    window._intakeDetailChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sources.map(s => s.source),
            datasets: [{
                data: sources.map(s => s.count||0),
                backgroundColor: sources.map((_,i) => colors[i%colors.length].replace(')',',0.7)')),
                borderColor: sources.map((_,i) => colors[i%colors.length]),
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true, cutout: '60%',
            plugins: {
                legend: { display: false }
            }
        }
    });
    const legend = document.getElementById('intakeLegend');
    if (legend) {
        legend.innerHTML = `<div class="row g-1">
        ${sources.map((s,i) => `
            <div class="col-6 d-flex align-items-center gap-2" style="font-size:0.78rem;">
                <div style="width:10px;height:10px;border-radius:50%;background:${colors[i%colors.length]};flex-shrink:0;"></div>
                <span style="color:var(--text-muted)">${s.source}</span>
                <span style="color:white;font-weight:600;margin-left:auto;">${s.count||0}</span>
            </div>`).join('')}
        </div>`;
    }
}

function buildPlatformChart(campaigns) {
    const ctx = document.getElementById('platformChart');
    if (!ctx) return;
    const platCounts = {};
    campaigns.forEach(c => { platCounts[c.platform] = (platCounts[c.platform]||0) + 1; });
    if (window._platformChartInst) window._platformChartInst.destroy();
    window._platformChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(platCounts),
            datasets: [{
                label: 'Campaigns',
                data: Object.values(platCounts),
                backgroundColor: ['#1877f222','#e4405f22','#ff000022','#01f0d022','#25d36622','#00b09b22','#ffa50222','#8892a422'],
                borderColor:     ['#1877f2',  '#e4405f',  '#ff0000',  '#01f0d0',  '#25d366',  '#00b09b',  '#ffa502',  '#8892a4'],
                borderWidth: 2, borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#8892a4'} },
                y: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#8892a4',stepSize:1} }
            }
        }
    });
}
