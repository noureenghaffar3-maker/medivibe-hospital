/* =========================================================
   MediVibe Patient Dashboard - Doctors directory logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  function initialsOf(name) {
    return (name || 'Dr').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  var doctors = [];
  var departments = [];

  function renderGrid(list) {
    var grid = $('doctorsGrid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-user-doctor"></i><p>No doctors found.</p><small>Try a different search.</small></div>';
      return;
    }
    grid.innerHTML = list.map(function (d) {
      return '<div class="tile-card">' +
        '<div class="avatar">' + (d.image ? '<img src="' + d.image + '" alt="' + d.name + '">' : initialsOf(d.name)) + '</div>' +
        '<h4>' + d.name + '</h4>' +
        '<div class="tile-sub">' + (d.specialty || d.department || d.designation || 'Specialist') + '</div>' +
        '<div class="exp-tag"><i class="fa-solid fa-briefcase"></i> ' + (d.experience || '8+ yrs exp') + '</div>' +
        '<div style="font-size:0.76rem;color:#64748b;margin-bottom:14px;">' +
        '  <div><i class="fa-solid fa-graduation-cap" style="color:#135dd8;"></i> ' + (d.qualifications || '—') + '</div>' +
        '  <div class="mt-1"><i class="fa-solid fa-calendar-days" style="color:#135dd8;"></i> ' + (d.days || 'Mon-Sat') + '</div>' +
        '  <div class="mt-1"><i class="fa-regular fa-clock" style="color:#135dd8;"></i> ' + (d.timings || '—') + '</div>' +
        '</div>' +
        '<div class="tile-actions">' +
        '  <button class="mini-btn primary-med" data-act="book" data-id="' + d.id + '"><i class="fa-solid fa-calendar-plus"></i> Book</button>' +
        '  <button class="mini-btn" data-act="view" data-id="' + d.id + '"><i class="fa-solid fa-eye"></i> Profile</button>' +
        '</div>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var doc = doctors.filter(function (d) { return d.id === btn.getAttribute('data-id'); })[0];
        if (!doc) return;
        if (btn.getAttribute('data-act') === 'book') {
          sessionStorage.setItem('pd_book_dept', doc.department || doc.specialty || '');
          window.location.href = 'appointments.html';
        } else {
          showProfile(doc);
        }
      });
    });
  }

  function showProfile(doc) {
    $('docModalBody').innerHTML =
      '<div class="text-center mb-3"><div class="avatar mx-auto" style="width:76px;height:76px;font-size:24px;background:#dbe9ff;color:#135dd8;">' + (doc.image ? '<img src="' + doc.image + '" alt="' + doc.name + '">' : initialsOf(doc.name)) + '</div>' +
      '<h4 class="mt-2 mb-0">' + doc.name + '</h4>' +
      '<div class="text-muted" style="font-size:0.85rem;">' + (doc.specialty || doc.department || doc.designation) + '</div>' +
      '<span class="exp-tag mt-2 d-inline-block"><i class="fa-solid fa-briefcase"></i> ' + (doc.experience || 'Experienced') + '</span></div>' +
      '<div class="row g-3">' +
      '  <div class="col-6"><div class="f-label">Qualifications</div><div style="font-size:0.86rem;">' + (doc.qualifications || '—') + '</div></div>' +
      '  <div class="col-6"><div class="f-label">Department</div><div style="font-size:0.86rem;">' + (doc.department || '—') + '</div></div>' +
      '  <div class="col-6"><div class="f-label">Working Days</div><div style="font-size:0.86rem;">' + (doc.days || '—') + '</div></div>' +
      '  <div class="col-6"><div class="f-label">Timings</div><div style="font-size:0.86rem;">' + (doc.timings || '—') + '</div></div>' +
      (doc.phone ? '<div class="col-12"><div class="f-label">Phone</div><div style="font-size:0.86rem;">' + doc.phone + '</div></div>' : '') +
      '</div>' +
      '<button type="button" class="btn-primary-med w-100 mt-3" data-bs-dismiss="modal" onclick="location.href=\'appointments.html\'"><i class="fa-solid fa-calendar-plus"></i> Book Appointment</button>';
    bootstrap.Modal.getOrCreateInstance($('docModal')).show();
  }

  function applyFilters() {
    var term = ($('docSearch').value || '').toLowerCase().trim();
    var dept = $('docDeptFilter').value;
    var list = doctors;
    if (dept) list = list.filter(function (d) { return (d.department || '') === dept; });
    if (term) {
      list = list.filter(function (d) {
        return (d.name + ' ' + (d.specialty || '') + ' ' + (d.department || '') + ' ' + (d.designation || '') + ' ' + (d.qualifications || '')).toLowerCase().indexOf(term) !== -1;
      });
    }
    renderGrid(list);
  }

  function boot() {
    doctors = PD.getDoctors ? PD.getDoctors() : [];
    departments = PD.getBookableDepartments ? PD.getBookableDepartments() : [];
    var deptSet = [];
    doctors.forEach(function (d) {
      if (d.department && deptSet.indexOf(d.department) === -1) deptSet.push(d.department);
    });
    $('docDeptFilter').innerHTML = '<option value="">All Departments</option>' + deptSet.map(function (d) { return '<option>' + d + '</option>'; }).join('');
    $('docSearch').addEventListener('input', applyFilters);
    $('docDeptFilter').addEventListener('change', applyFilters);
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();