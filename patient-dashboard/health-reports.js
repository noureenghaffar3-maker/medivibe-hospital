/* =========================================================
   MediVibe Patient Dashboard - Health/Lab reports logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  var reports = [];
  var donutChart = null;

  var colors = { primary: '#135dd8', green: '#16a34a', orange: '#d97706', cyan: '#00b4d8' };

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(String(iso) + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function statusPill(status) {
    var st = (status || '').toLowerCase();
    var cls = { ready: 'ready', pending: 'processing', processing: 'processing' };
    var label = { ready: 'Ready', pending: 'Pending', processing: 'Processing' };
    return '<span class="status-pill ' + (cls[st] || 'processing') + '">' + (label[st] || status) + '</span>';
  }

  function renderSummary(rows) {
    var ready = rows.filter(function (r) { return (r.status || '').toLowerCase() === 'ready'; }).length;
    var pending = rows.filter(function (r) { return (r.status || '').toLowerCase() === 'pending'; }).length;
    var processing = rows.filter(function (r) { return (r.status || '').toLowerCase() === 'processing'; }).length;
    $('rpReady').textContent = ready;
    $('rpPending').textContent = pending;
    $('rpProcessing').textContent = processing;
    $('rpTotal').textContent = rows.length;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart($('reportDonut'), {
      type: 'doughnut',
      data: {
        labels: ['Ready', 'Pending', 'Processing'],
        datasets: [{ data: [ready, pending, processing], backgroundColor: [colors.green, colors.orange, colors.cyan], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11, family: 'Roboto' } } } }
      }
    });
  }

  function renderTable(rows) {
    var body = $('reportTableBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No reports found.</p><small>Nothing matches your search.</small></div></td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td><div class="d-flex align-items-center gap-2"><i class="fa-solid ' + (String(r.type).toLowerCase().indexOf('imaging') !== -1 ? 'fa-x-ray' : 'fa-flask') + '" style="color:#135dd8;"></i><span style="font-weight:600;">' + r.name + '</span></div></td>' +
        '<td>' + r.type + '</td>' +
        '<td><div class="doc-cell">' +
        '  <div class="avatar">' + (r.doctorInitials || (r.doctor || 'Dr').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2)) + '</div>' +
        '  <div><div class="doc-name">' + r.doctor + '</div></div></div></td>' +
        '<td>' + fmtDate(r.date) + '</td>' +
        '<td>' + statusPill(r.status) + '</td>' +
        '<td class="table-actions"><button class="mini-btn primary-med" data-id="' + r.id + '"><i class="fa-solid fa-download"></i> Download</button></td>' +
        '</tr>';
    }).join('');

    body.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var r = reports.filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
        downloadReport(r);
      });
    });
  }

  function downloadReport(r) {
    if (!r) return;
    var w = window.open('', '_blank');
    if (!w) { if (window.pdToast) window.pdToast('Please allow pop-ups to download.', 'error'); return; }
    w.document.write(
      '<html><head><title>' + r.name + '</title>' +
      '<style>body{font-family:Roboto,Arial,sans-serif;padding:30px;color:#0f172a;}' +
      '.hd{border-bottom:2px solid #135dd8;padding-bottom:12px;margin-bottom:20px;}' +
      'h1{font-size:20px;margin:0;} .sub{color:#64748b;font-size:12px;margin-top:4px;}' +
      'table{width:100%;border-collapse:collapse;font-size:13px;} td,th{padding:8px 10px;border:1px solid #e2e8f0;text-align:left;}' +
      '</style></head><body>' +
      '<div class="hd"><h1>Medivibe Hospital</h1><div class="sub">Diagnostic Report</div></div>' +
      '<table><tr><td><b>Report:</b> ' + r.name + '</td><td><b>Type:</b> ' + r.type + '</td></tr>' +
      '<tr><td><b>Doctor:</b> ' + r.doctor + '</td><td><b>Date:</b> ' + fmtDate(r.date) + '</td></tr>' +
      '<tr><td><b>Status:</b> ' + r.status + '</td><td></td></tr></table>' +
      '<p style="margin-top:24px;color:#94a3b8;font-size:11px;">This is a generated summary. Please consult your doctor for interpretation.</p>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }

  function applyFilters() {
    var term = ($('rpSearch').value || '').toLowerCase().trim();
    var out = reports;
    if (term) {
      out = out.filter(function (r) {
        return (r.name + ' ' + r.doctor + ' ' + r.type).toLowerCase().indexOf(term) !== -1;
      });
    }
    renderTable(out);
  }

  function boot() {
    reports = PD.getReports ? PD.getReports() : [];
    $('rpSearch').addEventListener('input', applyFilters);
    renderSummary(reports);
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();