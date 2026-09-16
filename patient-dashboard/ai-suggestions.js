/* =========================================================
   MediVibe Patient Dashboard - AI Suggestions logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  function render(list) {
    var grid = $('suggestionsGrid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-robot"></i><p>No suggestions right now.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function (s) {
      var action = '';
      if (s.actionType === 'followup') {
        action = '<a href="appointments.html" class="mini-btn solid"><i class="fa-solid fa-calendar-plus"></i> ' + s.action + '</a>';
      } else if (s.actionType === 'refill') {
        action = '<button class="mini-btn solid refill-btn"><i class="fa-solid fa-pills"></i> ' + s.action + '</button>';
      } else if (s.actionType === 'report') {
        action = '<a href="health-reports.html" class="mini-btn primary-med"><i class="fa-solid fa-folder-open"></i> ' + s.action + '</a>';
      } else {
        action = '<button class="mini-btn dismiss-btn"><i class="fa-solid fa-xmark"></i> Dismiss</button>';
      }
      return '<div class="ai-card ' + (s.type === 'high' ? 'high' : '') + '">' +
        '<div class="ai-icon ' + s.iconColor + '"><i class="fa-solid ' + s.icon + '"></i></div>' +
        '<div style="flex:1;">' +
        '  <h4>' + s.title + '</h4>' +
        '  <p>' + s.text + '</p>' +
        '  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
        '    <span class="ai-time"><i class="fa-regular fa-clock"></i> ' + s.time + '</span>' +
        '    <div style="display:flex;gap:8px;">' + action + '</div>' +
        '  </div>' +
        '</div></div>';
    }).join('');

    grid.querySelectorAll('.dismiss-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.ai-card').style.display = 'none';
        if (window.pdToast) window.pdToast('Dismissed.', 'success');
      });
    });
    grid.querySelectorAll('.refill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.textContent = 'Request Sent ✓';
        if (window.pdToast) window.pdToast('Refill request sent to pharmacy!', 'success');
      });
    });
  }

  function boot() {
    var list = PD.getSuggestions ? PD.getSuggestions() : [];
    render(list);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();