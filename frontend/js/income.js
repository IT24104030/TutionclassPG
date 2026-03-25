/* ============================================
   income.js - Income / Payment Management
   ============================================ */

async function renderIncome() {
    try {
        const [payments, students, batches] = await Promise.all([
            api('/payments'),
            api('/students'),
            api('/batches')
        ]);

        const total   = payments.reduce((s,p) => p.status==='PAID' ? s+p.amount : s, 0);
        const pending = payments.filter(p=>p.status==='PENDING').length;
        const overdue = payments.filter(p=>p.status==='OVERDUE').length;
        const partial = payments.filter(p=>p.status==='PARTIAL').length;

        document.getElementById('pageContent').innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-coins me-2 text-primary-custom"></i>Income Management</h4>
            <button class="btn btn-primary-custom" onclick="showAddPayment()">
                <i class="fas fa-plus me-2"></i>Record Payment
            </button>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#00b09b; --stat-bg:rgba(0,176,155,0.1)">
                    <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div><div class="stat-value">Rs.${numFmt(total)}</div><div class="stat-label">Total Collected</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#ffa502; --stat-bg:rgba(255,165,2,0.1)">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div><div class="stat-value">${pending}</div><div class="stat-label">Pending</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#ff4757; --stat-bg:rgba(255,71,87,0.1)">
                    <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <div><div class="stat-value">${overdue}</div><div class="stat-label">Overdue</div></div>
                </div>
            </div>
            <div class="col-sm-3">
                <div class="stat-card" style="--stat-color:#667eea; --stat-bg:rgba(102,126,234,0.1)">
                    <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                    <div><div class="stat-value">${payments.length}</div><div class="stat-label">Total Records</div></div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header"><h6 class="card-title">Monthly Income Overview</h6></div>
                    <div class="card-body"><canvas id="incomeDetailChart" height="120"></canvas></div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card h-100">
                    <div class="card-header"><h6 class="card-title">Payment Status</h6></div>
                    <div class="card-body d-flex align-items-center justify-content-center">
                        <canvas id="payStatusChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="p-3 border-bottom border-custom d-flex flex-wrap gap-2 align-items-center">
                <div class="btn-group" id="payStatusFilter">
                    <button class="btn btn-sm btn-primary-custom active" onclick="filterPayments('ALL',this)">All</button>
                    <button class="btn btn-sm" onclick="filterPayments('PAID',this)" style="background:rgba(0,176,155,0.1);color:#00b09b;border:1px solid rgba(0,176,155,0.2)">Paid</button>
                    <button class="btn btn-sm" onclick="filterPayments('PENDING',this)" style="background:rgba(255,165,2,0.1);color:#ffa502;border:1px solid rgba(255,165,2,0.2)">Pending</button>
                    <button class="btn btn-sm" onclick="filterPayments('OVERDUE',this)" style="background:rgba(255,71,87,0.1);color:#ff4757;border:1px solid rgba(255,71,87,0.2)">Overdue</button>
                    <button class="btn btn-sm" onclick="filterPayments('PARTIAL',this)" style="background:rgba(102,126,234,0.1);color:var(--primary);border:1px solid rgba(102,126,234,0.2)">Partial</button>
                </div>
                <div class="ms-auto" style="color:var(--text-muted);font-size:0.8rem;" id="payFilterInfo"></div>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead><tr><th>Receipt#</th><th>Student</th><th>Batch</th><th>Amount</th><th>Month</th><th>Status</th><th>Paid On</th><th>Actions</th></tr></thead>
                    <tbody id="paymentsBody">${renderPaymentRows(payments)}</tbody>
                </table>
            </div>
        </div>`;

        window._allPayments = payments;
        window._payStudents = students;
        window._payBatches  = batches;

        setTimeout(() => {
            buildIncomeDetailChart(payments);
            buildPayStatusChart(payments);
        }, 100);

    } catch (err) { showError(err.message); }
}

function renderPaymentRows(payments) {
    if (!payments.length) return `<tr><td colspan="8" class="text-center py-5" style="color:var(--text-muted)">No payments found</td></tr>`;
    return payments.map(p => `
    <tr>
        <td><code style="color:var(--primary);font-size:0.75rem;">${p.receiptNo||'-'}</code></td>
        <td style="color:white;font-weight:500">${p.student?.fullName||'-'}</td>
        <td style="color:var(--text-muted)">${p.batch?.batchName||'-'}</td>
        <td style="color:#00b09b;font-weight:700">Rs.${numFmt(p.amount)}</td>
        <td style="color:var(--text-muted)">${p.paymentMonth||''} ${p.paymentYear||''}</td>
        <td>${statusBadge(p.status)}</td>
        <td style="color:var(--text-muted)">${p.paidDate ? dateFmt(p.paidDate) : '-'}</td>
        <td>
            <div class="d-flex gap-1">
                ${p.status !== 'PAID' ? `<button class="btn btn-sm" onclick="markPaid(${p.id})" style="background:rgba(0,176,155,0.1);color:#00b09b;border:1px solid rgba(0,176,155,0.2);font-size:0.72rem;padding:4px 8px;border-radius:6px;">Mark Paid</button>` : ''}
                <button class="btn btn-edit-custom btn-sm" onclick="editPayment(${p.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger-custom btn-sm" onclick="deletePayment(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function filterPayments(status, btn) {
    document.querySelectorAll('#payStatusFilter .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = status === 'ALL' ? window._allPayments : (window._allPayments||[]).filter(p=>p.status===status);
    document.getElementById('paymentsBody').innerHTML = renderPaymentRows(filtered||[]);
    document.getElementById('payFilterInfo').textContent = `Showing ${filtered.length} records`;
}

async function showAddPayment() {
    const students = window._payStudents || [];
    const batches  = window._payBatches  || [];
    const months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const form = `
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Student *</label>
            <select class="form-select" id="pStudent">
                <option value="">Select Student</option>
                ${students.map(s=>`<option value="${s.id}">${s.fullName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Batch *</label>
            <select class="form-select" id="pBatch">
                <option value="">Select Batch</option>
                ${batches.map(b=>`<option value="${b.id}">${b.batchName}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Amount (Rs.) *</label><input class="form-control" id="pAmount" type="number" step="0.01"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="pStatus">
                <option>PAID</option><option>PENDING</option><option>PARTIAL</option><option>OVERDUE</option>
            </select></div>
        <div class="col-md-4"><label class="form-label">Month</label>
            <select class="form-select" id="pMonth">
                ${months.map((m,i)=>`<option value="${m}" ${i===new Date().getMonth()?'selected':''}>${m}</option>`).join('')}
            </select></div>
        <div class="col-md-4"><label class="form-label">Year</label><input class="form-control" id="pYear" type="number" value="${new Date().getFullYear()}"></div>
        <div class="col-md-4"><label class="form-label">Paid Date</label><input class="form-control" id="pPaidDate" type="date" value="${new Date().toISOString().split('T')[0]}" max="${new Date().toISOString().split('T')[0]}"></div>
        <div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" id="pNotes" rows="2"></textarea></div>
    </div>`;
    openModal('<i class="fas fa-plus me-2"></i>Record Payment', form, async () => {
        const payload = {
            student: { id: parseInt(document.getElementById('pStudent').value) },
            batch:   document.getElementById('pBatch').value ? { id: parseInt(document.getElementById('pBatch').value) } : null,
            amount:  parseFloat(document.getElementById('pAmount').value),
            status:  document.getElementById('pStatus').value,
            paymentMonth: document.getElementById('pMonth').value,
            paymentYear:  parseInt(document.getElementById('pYear').value),
            paidDate:     document.getElementById('pPaidDate').value||null,
            notes:        document.getElementById('pNotes').value,
        };
        if (!payload.student.id || !payload.batch || !payload.amount) return toast('Fill required fields','warning');
        if (payload.paidDate && payload.paidDate > new Date().toISOString().split('T')[0]) {
            return toast('Paid date cannot be in the future', 'warning');
        }
        try { await api('/payments','POST',payload); closeModal(); toast('Payment recorded!'); renderIncome(); }
        catch(err) { showError(err.message); }
    });
}

async function markPaid(id) {
    try {
        await api(`/payments/${id}/mark-paid`,'PUT');
        toast('Marked as Paid!');
        renderIncome();
    } catch(err) { showError(err.message); }
}

async function editPayment(id) {
    const p = await api(`/payments/${id}`);
    const form = `
    <input type="hidden" id="editPayId" value="${id}">
    <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Amount</label><input class="form-control" id="epAmount" type="number" value="${p.amount}"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
            <select class="form-select" id="epStatus">
                ${['PAID','PENDING','PARTIAL','OVERDUE'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}
            </select></div>
        <div class="col-md-6"><label class="form-label">Paid Date</label><input class="form-control" id="epPaid" type="date" value="${p.paidDate||''}" max="${new Date().toISOString().split('T')[0]}"></div>
        <div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" id="epNotes" rows="2">${p.notes||''}</textarea></div>
    </div>`;
    openModal('<i class="fas fa-edit me-2"></i>Edit Payment', form, async() => {
        const payload = {
            amount:   parseFloat(document.getElementById('epAmount').value),
            status:   document.getElementById('epStatus').value,
            paidDate: document.getElementById('epPaid').value||null,
            notes:    document.getElementById('epNotes').value,
        };
        if (payload.paidDate && payload.paidDate > new Date().toISOString().split('T')[0]) {
            return toast('Paid date cannot be in the future', 'warning');
        }
        try { await api(`/payments/${id}`,'PUT',payload); closeModal(); toast('Payment updated!'); renderIncome(); }
        catch(err) { showError(err.message); }
    });
}

function deletePayment(id) {
    confirmDelete('Delete this payment record?', async() => {
        try { await api(`/payments/${id}`,'DELETE'); toast('Payment deleted!'); renderIncome(); }
        catch(err) { showError(err.message); }
    });
}

function buildIncomeDetailChart(payments) {
    const ctx = document.getElementById('incomeDetailChart');
    if (!ctx) return;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = new Array(12).fill(0);
    payments.filter(p => p.status==='PAID').forEach(p => {
        const monthIdx = months.indexOf((p.paymentMonth||'').substring(0,3));
        if (monthIdx >= 0) data[monthIdx] += p.amount;
    });
    if (window._incomeDetailChartInst) window._incomeDetailChartInst.destroy();
    window._incomeDetailChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Income (Rs)',
                data,
                backgroundColor: 'rgba(102,126,234,0.4)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(102,126,234,0.7)',
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color:'rgba(255,255,255,0.05)' }, ticks: { color:'#8892a4' } },
                y: { grid: { color:'rgba(255,255,255,0.05)' }, ticks: { color:'#8892a4', callback: v => `Rs.${numFmt(v)}` } }
            }
        }
    });
}

function buildPayStatusChart(payments) {
    const ctx = document.getElementById('payStatusChart');
    if (!ctx) return;
    const counts = { PAID:0, PENDING:0, OVERDUE:0, PARTIAL:0 };
    payments.forEach(p => { if (counts[p.status]!==undefined) counts[p.status]++; });
    if (window._payStatusChartInst) window._payStatusChartInst.destroy();
    window._payStatusChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid','Pending','Overdue','Partial'],
            datasets: [{
                data: [counts.PAID, counts.PENDING, counts.OVERDUE, counts.PARTIAL],
                backgroundColor: ['rgba(0,176,155,0.7)','rgba(255,165,2,0.7)','rgba(255,71,87,0.7)','rgba(102,126,234,0.7)'],
                borderColor:     ['#00b09b','#ffa502','#ff4757','#667eea'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position:'bottom', labels:{ color:'#8892a4', padding:10, font:{size:11} } }
            },
            cutout: '65%',
        }
    });
}
