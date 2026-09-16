/* =========================================================
   MediVibe Patient Dashboard - Invoices & billing logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(String(iso) + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function money(n) {
    return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  }

  function statusPill(status) {
    var st = (status || '').toLowerCase();
    var map = { paid: 'paid', 'partially-paid': 'partial', 'partially paid': 'partial', unpaid: 'unpaid', pending: 'unpaid' };
    var cls = map[st] || 'scheduled';
    var label = { paid: 'Paid', partial: 'Partially Paid', unpaid: 'Unpaid', scheduled: '—' };
    return '<span class="status-pill ' + cls + '">' + (label[cls] || st) + '</span>';
  }

  var list = [];
  var currentInv = null;

  function renderSummary(rows) {
    $('invTotal').textContent = rows.length;
    var paid = 0, pending = 0;
    rows.forEach(function (r) {
      var st = (r.status || '').toLowerCase();
      if (st === 'paid') paid += Number(r.amount || 0);
      else if (st === 'partially-paid' || st === 'partially paid') { paid += Number(r.amount || 0) / 2; pending += Number(r.amount || 0) / 2; }
      else pending += Number(r.amount || 0);
    });
    $('invPaid').textContent = money(paid);
    $('invPending').textContent = money(pending);
  }

  function applyFilters() {
    var term = ($('invSearch').value || '').toLowerCase().trim();
    var st = $('invStatusFilter').value;
    var out = list.filter(function (r) {
      if (st && String(r.status).toLowerCase() !== String(st).toLowerCase()) return false;
      if (term) {
        var hay = (r.id + ' ' + r.description).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });
    renderSummary(out);
    renderTable(out);
  }

  function renderTable(rows) {
    var body = $('invTableBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No invoices found.</p><small>Nothing matches your filters.</small></div></td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td style="font-weight:600;">' + r.id + '</td>' +
        '<td>' + r.description + '</td>' +
        '<td>' + fmtDate(r.created) + '</td>' +
        '<td>' + fmtDate(r.due) + '</td>' +
        '<td style="font-weight:600;">' + money(r.amount) + '</td>' +
        '<td>' + statusPill(r.status) + '</td>' +
        '<td class="table-actions">' +
        '  <button class="mini-btn" data-act="view" data-id="' + r.id + '"><i class="fa-solid fa-eye"></i> View</button> ' +
        '  <button class="mini-btn primary-med" data-act="dl" data-id="' + r.id + '"><i class="fa-solid fa-download"></i></button>' +
        '</td></tr>';
    }).join('');

    body.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inv = list.filter(function (r) { return r.id === btn.getAttribute('data-id'); })[0];
        if (!inv) return;
        if (btn.getAttribute('data-act') === 'view') showInvoice(inv);
        else downloadInvoice(inv);
      });
    });
  }

  function invoiceHTML(inv) {
    return '<div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">' +
      '  <div><div style="font-weight:700;font-size:1.05rem;">' + inv.id + '</div>' +
      '  <div class="text-muted" style="font-size:0.8rem;">' + inv.description + '</div></div>' +
      '  <span class="status-pill ' + (String(inv.status).toLowerCase() === 'paid' ? 'paid' : String(inv.status).toLowerCase() === 'unpaid' ? 'unpaid' : 'partial') + '">' + inv.status + '</span>' +
      '</div>' +
      '<hr>' +
      '<div class="row g-2" style="font-size:0.86rem;">' +
      '  <div class="col-6"><span class="text-muted">Created</span><div style="font-weight:600;">' + fmtDate(inv.created) + '</div></div>' +
      '  <div class="col-6"><span class="text-muted">Due Date</span><div style="font-weight:600;">' + fmtDate(inv.due) + '</div></div>' +
      '  <div class="col-12 mt-3"><span class="text-muted">Amount</span><div style="font-size:1.3rem;font-weight:700;color:#135dd8;">' + money(inv.amount) + '</div></div>' +
      '</div>' +
      '<hr style="border-style:dashed;">' +
      '<div class="text-center text-muted" style="font-size:0.76rem;">Medivibe Hospital · Thank you for choosing us!</div>';
  }

  function showInvoice(inv) {
    currentInv = inv;
    $('invModalBody').innerHTML = invoiceHTML(inv);
    bootstrap.Modal.getOrCreateInstance($('invModal')).show();
  }

  function downloadInvoice(inv) {
    var w = window.open('', '_blank');
    if (!w) { if (window.pdToast) window.pdToast('Please allow pop-ups to download.', 'error'); return; }
    var styles = document.querySelectorAll('style,link[rel="stylesheet"]');
    var links = '';
    styles.forEach(function (s) { links += s.outerHTML; });
    w.document.write('<html><head><title>' + inv.id + '</title>' + links + '<style>@page{margin:16mm}body{background:#fff!important;padding:24px!important}</style></head><body>' + invoiceHTML(inv) + '</body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }

  $('invDownloadBtn').addEventListener('click', function () {
    if (currentInv) downloadInvoice(currentInv);
  });

  function boot() {
    list = PD.getInvoices ? PD.getInvoices() : [];
    $('invStatusFilter').addEventListener('change', applyFilters);
    $('invSearch').addEventListener('input', applyFilters);
    $('invResetBtn').addEventListener('click', function () {
      $('invStatusFilter').value = ''; $('invSearch').value = '';
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