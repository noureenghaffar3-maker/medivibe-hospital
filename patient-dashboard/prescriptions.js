/* =========================================================
   MediVibe Patient Dashboard - Prescriptions list logic
   (Dynamic: click a row -> patient-prescription-details.html?id=)
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
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + (time || '');
  }

  var list = [];

  function statusPill(status) {
    var st = (status || 'Active').toLowerCase();
    var cls = { active: 'scheduled', completed: 'completed' };
    return '<span class="status-pill ' + (cls[st] || 'scheduled') + '">' + (st === 'active' ? 'Active' : 'Completed') + '</span>';
  }

  function applyFilters() {
    var term = ($('presSearch').value || '').toLowerCase().trim();
    var from = $('presFrom').value;
    var to = $('presTo').value;

    var out = list.filter(function (p) {
      if (term) {
        var hay = (p.id + ' ' + p.doctor + ' ' + p.specialty + ' ' + p.department).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      if (from && String(p.date) < from) return false;
      if (to && String(p.date) > to) return false;
      return true;
    });
    renderTable(out);
  }

  function renderTable(rows) {
    var body = $('presTableBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-file-prescription"></i><p>No prescriptions found.</p><small>Nothing matches your search — try different keywords.</small></div></td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (p) {
      return '<tr style="cursor:pointer;">' +
        '<td style="font-weight:600;">' + p.id + '</td>' +
        '<td><div class="doc-cell">' +
        '  <div class="avatar">' + initialsOf(p.doctor) + '</div>' +
        '  <div><div class="doc-name">' + p.doctor + '</div><div class="doc-sub">' + p.specialty + '</div></div>' +
        '</div></td>' +
        '<td>' + p.department + '</td>' +
        '<td>' + fmtDateTime(p.date, p.time) + '</td>' +
        '<td>' + statusPill(p.status) + '</td>' +
        '<td class="table-actions">' +
        '  <button class="mini-btn primary-med" data-act="view" data-id="' + p.id + '"><i class="fa-solid fa-eye"></i> View Details</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    body.querySelectorAll('[data-act="view"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'patient-prescription-details.html?id=' + encodeURIComponent(btn.getAttribute('data-id'));
      });
    });
    // Row click also opens detail
    body.querySelectorAll('tr[style]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('[data-act]')) return;
        var btn = tr.querySelector('[data-act="view"]');
        if (btn) window.location.href = 'patient-prescription-details.html?id=' + encodeURIComponent(btn.getAttribute('data-id'));
      });
    });
  }

  function boot() {
    list = PD.getPrescriptions ? PD.getPrescriptions() : [];
    $('presSearch').addEventListener('input', applyFilters);
    $('presFrom').addEventListener('change', applyFilters);
    $('presTo').addEventListener('change', applyFilters);
    $('presResetBtn').addEventListener('click', function () {
      $('presSearch').value = ''; $('presFrom').value = ''; $('presTo').value = '';
      applyFilters();
    });
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();