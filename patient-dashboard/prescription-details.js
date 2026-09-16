/* =========================================================
   MediVibe Patient Dashboard - Single Prescription View
   Loads by ?id= from PD.PRESCRIPTIONS (dynamic, one file)
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  function initialsOf(name) {
    return (name || 'Dr').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  function fmtDateTime(date, time) {
    if (!date) return '-';
    var d = new Date(String(date) + 'T00:00:00');
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + (time || '');
  }

  var id = new URLSearchParams(window.location.search).get('id') || '';
  var pres = null;

  function findPrescription() {
    var list = PD.getPrescriptions ? PD.getPrescriptions() : [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return list[0] || null;
  }

  function render() {
    pres = findPrescription();
    var card = $('rxCard');
    if (!pres) {
      card.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-prescription"></i><p>Prescription not found.</p><a href="prescriptions.html" class="mini-btn primary-med mt-2">Back to list</a></div>';
      return;
    }

    var medRows = (pres.items || []).map(function (m, i) {
      return '<tr>' +
        '<td style="width:36px;">' + (i + 1) + '</td>' +
        '<td><div style="font-weight:600;">' + m.name + '</div>' +
        (m.note ? '<div class="doc-sub">' + m.note + '</div>' : '') + '</td>' +
        '<td style="white-space:nowrap;"><span class="status-pill scheduled">' + m.dosage + '</span></td>' +
        '<td>' + (m.duration || '-') + '</td>' +
        '</tr>';
    }).join('');

    card.innerHTML =
      '<div class="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">' +
      '  <div>' +
      '    <div style="font-size:0.78rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Medivibe Hospital</div>' +
      '    <h3 class="mt-1 mb-0">' + pres.id + '</h3>' +
      '    <div class="text-muted" style="font-size:0.82rem;">Issued on ' + fmtDateTime(pres.date, pres.time) + '</div>' +
      '  </div>' +
      '  <span class="status-pill ' + (String(pres.status).toLowerCase() === 'completed' ? 'completed' : 'scheduled') + '">' + pres.status + '</span>' +
      '</div>' +

      '<div class="d-flex align-items-center gap-3 mb-4 p-3 rounded" style="background:#f7fafc;border:1px solid #eef1f6;">' +
      '  <div class="avatar" style="width:52px;height:52px;font-size:16px;">' + initialsOf(pres.doctor) + '</div>' +
      '  <div style="flex:1;">' +
      '    <div style="font-weight:700;">' + pres.doctor + '</div>' +
      '    <div class="text-muted" style="font-size:0.82rem;">' + pres.specialty + ' · ' + pres.department + '</div>' +
      '  </div>' +
      '</div>' +

      '<h5 class="mb-2" style="font-weight:700;"><i class="fa-solid fa-pills" style="color:#135dd8;"></i> Medications</h5>' +
      '<div class="table-responsive mb-4">' +
      '<table class="table-med">' +
      '  <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Duration</th></tr></thead>' +
      '  <tbody>' + medRows + '</tbody>' +
      '</table></div>' +

      '<div class="p-3 rounded mb-3" style="background:#fff8e6;border:1px solid #f3e4b8;">' +
      '  <div style="font-weight:700;margin-bottom:4px;"><i class="fa-solid fa-clipboard-check" style="color:#92600a;"></i> Doctor\'s Advice</div>' +
      '  <div style="font-size:0.88rem;color:#5b4a1b;">' + (pres.advice || '—') + '</div>' +
      '</div>' +

      '<div style="text-align:right;opacity:0.75;font-size:0.8rem;">' +
      '  <div style="font-style:italic;font-family:\'Brush Script MT\',cursive;font-size:1.6rem;color:#333;">Dr. ' + pres.doctor.replace('Dr. ', '') + '</div>' +
      '  <div class="text-muted" style="font-size:0.72rem;">Digital Signature</div>' +
      '</div>';
  }

  function downloadPdf() {
    var w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups to download the PDF.'); return; }
    var styles = document.querySelectorAll('link[rel="stylesheet"],style');
    var links = '';
    styles.forEach(function (s) { links += s.outerHTML + '\n'; });
    w.document.write(
      '<html><head><title>' + (pres ? pres.id : 'Prescription') + '</title>' + links +
      '<style>@page{margin:16mm} body{background:#fff!important;padding:20px!important}</style></head><body>' +
      (pres ? cardHTML() : '') + '</body></html>'
    );
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }

  function cardHTML() {
    return $('rxCard').innerHTML;
  }

  function boot() {
    render();
    $('printBtn').addEventListener('click', function () { window.print(); });
    $('downloadBtn').addEventListener('click', downloadPdf);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();