/* =========================================================
   MediVibe Patient Dashboard - Appointments page logic
   ========================================================= */
(function () {
  var PD = window.PD || {};
  var mv = window.mvFirebase;
  var db = mv ? mv.db : null;

  function $(id) { return document.getElementById(id); }

  function initialsOf(name) {
    return (name || 'Dr').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(String(iso) + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function statusPill(status) {
    var st = (status || 'scheduled').toLowerCase();
    var cls = { scheduled: 'scheduled', pending: 'pending', confirmed: 'scheduled', completed: 'completed', cancelled: 'cancelled' };
    var label = { scheduled: 'Scheduled', pending: 'Pending', confirmed: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' };
    return '<span class="status-pill ' + (cls[st] || 'scheduled') + '">' + (label[st] || 'Scheduled') + '</span>';
  }

  var state = { list: [], doctors: [], departments: [], times: [] };

  function loadState() {
    state.doctors = PD.getDoctors ? PD.getDoctors() : [];
    state.departments = PD.getBookableDepartments ? PD.getBookableDepartments() : [];
    state.times = PD.getTimeSlots ? PD.getTimeSlots() : [];
    state.list = PD.getAppointments ? PD.getAppointments() : [];
  }

  /* ---------- filters ---------- */
  function applyFilters() {
    var term = ($('aptSearch').value || '').toLowerCase().trim();
    var doc = $('aptDoctorFilter').value;
    var dept = $('aptDeptFilter').value;
    var date = $('aptDateFilter').value;

    var out = state.list.filter(function (a) {
      if (doc && a.doctorName !== doc) return false;
      if (dept && a.specialty !== dept) return false;
      if (date && String(a.date || '') !== date) return false;
      if (term) {
        var hay = (a.doctorName + ' ' + a.specialty + ' ' + (a.id || '')).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });
    renderTable(out);
  }

  function renderTable(list) {
    var body = $('aptTableBody');
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>No appointments found.</p><small>Try adjusting the filters or book a new appointment.</small></div></td></tr>';
      return;
    }
    body.innerHTML = list.map(function (a) {
      var cancellable = (a.status || '').toLowerCase() !== 'completed' && (a.status || '').toLowerCase() !== 'cancelled';
      return '<tr>' +
        '<td style="font-weight:600;">' + (a.id || '-') + '</td>' +
        '<td><div class="doc-cell">' +
        '  <div class="avatar">' + (a.avatar || initialsOf(a.doctorName)) + '</div>' +
        '  <div><div class="doc-name">' + a.doctorName + '</div></div></div></td>' +
        '<td>' + a.specialty + '</td>' +
        '<td><div style="font-weight:600;">' + fmtDate(a.date) + '</div><div class="doc-sub">' + (a.time || '-') + '</div></td>' +
        '<td>' + ((a.type || 'In-Person') === 'Online'
          ? '<span class="status-pill checked-out"><i class="fa-solid fa-video"></i> Online</span>'
          : '<span class="status-pill"><i class="fa-solid fa-hospital"></i> In-Person</span>') + '</td>' +
        '<td>' + (a.fees ? 'Rs ' + Number(a.fees).toLocaleString() : '-') + '</td>' +
        '<td>' + statusPill(a.status) + '</td>' +
        '<td class="table-actions">' +
        (cancellable
          ? '<button class="mini-btn" data-act="resched" data-id="' + a.id + '"><i class="fa-solid fa-clock-rotate-left"></i></button> ' +
            '<button class="mini-btn danger" data-act="cancel" data-id="' + a.id + '"><i class="fa-solid fa-xmark"></i></button>'
          : '<span class="doc-sub">—</span>') +
        '</td>' +
        '</tr>';
    }).join('');

    body.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (btn.getAttribute('data-act') === 'cancel') cancelAppt(id);
        else openResched(id);
      });
    });
  }

  function findById(id) {
    return state.list.filter(function (a) { return a.id === id; })[0];
  }

  /* ---------- cancel ---------- */
  function cancelAppt(id) {
    var a = findById(id);
    if (!a) return;
    if (!confirm('Cancel appointment ' + id + ' with ' + a.doctorName + '?')) return;
    a.status = 'cancelled';
    if (db && window.pdUser && window.pdUser.userId && a.firebaseDoc) {
      db.collection('appointments').doc(a.firebaseDoc).update({ status: 'cancelled' }).catch(function () {});
    }
    window.pdToast('Appointment ' + id + ' cancelled.', 'success');
    applyFilters();
  }

  /* ---------- reschedule ---------- */
  var reschedId = null;
  function openResched(id) {
    var a = findById(id);
    if (!a) return;
    reschedId = id;
    $('reschedLabel').textContent = 'Rescheduling ' + id + ' with ' + a.doctorName + ' (' + a.specialty + ').';
    $('rsDate').min = todayISO();
    $('rsTime').innerHTML = '<option value="">Select time</option>' + state.times.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    $('rsSuccess').classList.remove('show');
    $('rsError').classList.remove('show');
    var modal = bootstrap.Modal.getOrCreateInstance($('reschedModal'));
    modal.show();
  }

  $('rsSaveBtn').addEventListener('click', function () {
    var a = findById(reschedId);
    var date = $('rsDate').value;
    var time = $('rsTime').value;
    if (!a) return;
    $('rsError').textContent = ''; $('rsError').classList.remove('show');
    if (!date) { $('rsError').textContent = 'Please choose a new date.'; $('rsError').classList.add('show'); return; }
    if (!time) { $('rsError').textContent = 'Please select a new time slot.'; $('rsError').classList.add('show'); return; }
    a.date = date; a.time = time;
    if (db && window.pdUser && window.pdUser.userId && a.firebaseDoc) {
      db.collection('appointments').doc(a.firebaseDoc).update({ date: date, time: time, status: 'pending' }).catch(function () {});
    }
    bootstrap.Modal.getInstance($('reschedModal')).hide();
    window.pdToast('Appointment ' + reschedId + ' rescheduled.', 'success');
    applyFilters();
  });

  /* ---------- booking modal ---------- */
  function populateBooking() {
    var dept = $('bkDept');
    dept.innerHTML = '<option value="">Select department</option>' + state.departments.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');

    $('bkTime').innerHTML = '<option value="">Select time</option>' + state.times.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    $('bkDate').min = todayISO();

    $('bkDept').addEventListener('change', function () {
      var docs = state.doctors.filter(function (d) { return d.department === dept.value; });
      $('bkDoctor').innerHTML = docs.length
        ? '<option value="">Select doctor</option>' + docs.map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('')
        : '<option value="">No doctors in this department</option>';
    });

    $('bkSubmitBtn').addEventListener('click', function () {
      var doctor = state.doctors.filter(function (d) { return d.id === $('bkDoctor').value; })[0];
      var date = $('bkDate').value;
      var time = $('bkTime').value;
      $('bkError').textContent = ''; $('bkError').classList.remove('show');
      if (!doctor) { $('bkError').textContent = 'Please select a doctor.'; $('bkError').classList.add('show'); return; }
      if (!date) { $('bkError').textContent = 'Please choose a date.'; $('bkError').classList.add('show'); return; }
      if (!time) { $('bkError').textContent = 'Please select a time slot.'; $('bkError').classList.add('show'); return; }

      var newAppt = {
        id: 'PD-' + Math.floor(1000 + Math.random() * 9000),
        doctorName: doctor.name,
        specialty: doctor.department,
        avatar: initialsOf(doctor.name),
        date: date,
        time: time,
        type: $('bkMode').value,
        status: 'pending',
        fees: doctor.fees || 2500,
        reason: $('bkReason').value.trim()
      };

      var done = function () {
        state.list.unshift(newAppt);
        $('bkSuccess').textContent = 'Appointment requested with ' + doctor.name + ' on ' + fmtDate(date) + ' at ' + time + '.';
        $('bkSuccess').classList.add('show');
        $('bkDept').value = ''; $('bkDoctor').value = ''; $('bkDate').value = ''; $('bkTime').value = ''; $('bkReason').value = '';
        applyFilters();
        setTimeout(function () {
          bootstrap.Modal.getInstance($('bookModal')).hide();
          $('bkSuccess').textContent = ''; $('bkSuccess').classList.remove('show');
          window.pdToast('Appointment requested successfully!', 'success');
        }, 1400);
      };

      // real Firebase booking if available
      if (db && window.pdUser && window.pdUser.userId && PD.isFirebaseReady()) {
        db.collection('appointments').add({
          userId: window.pdUser.userId,
          patientName: window.pdUser.name,
          patientEmail: window.pdUser.email,
          doctorId: doctor.id,
          doctorName: doctor.name,
          department: doctor.department,
          date: date,
          time: time,
          mode: $('bkMode').value,
          notes: $('bkReason').value.trim(),
          status: 'pending',
          createdAt: new Date().toISOString()
        }).then(function (ref) {
          newAppt.firebaseDoc = ref.id;
          newAppt.id = ref.id;
          done();
        }).catch(function (err) {
          if (mv) { $('bkError').textContent = mv.getErrorMessage(err); $('bkError').classList.add('show'); }
          else done();
        });
      } else {
        done();
      }
    });
  }

  /* ---------- filter UI ---------- */
  function buildFilters() {
    var docSel = $('aptDoctorFilter');
    var deptSel = $('aptDeptFilter');
    docSel.innerHTML = '<option value="">All Doctors</option>' + state.doctors.map(function (d) { return '<option>' + d.name + '</option>'; }).join('');
    deptSel.innerHTML = '<option value="">All Departments</option>' + state.departments.map(function (d) { return '<option>' + d + '</option>'; }).join('');

    $('aptSearch').addEventListener('input', applyFilters);
    docSel.addEventListener('change', applyFilters);
    deptSel.addEventListener('change', applyFilters);
    $('aptDateFilter').addEventListener('change', applyFilters);
    $('aptResetBtn').addEventListener('click', function () {
      $('aptSearch').value = ''; docSel.value = ''; deptSel.value = ''; $('aptDateFilter').value = '';
      applyFilters();
    });
  }

  /* ---------- boot ---------- */
  var started = false;
  function boot() {
    if (started) return;
    started = true;
    loadState();
    buildFilters();
    populateBooking();
    applyFilters();
  }

  document.addEventListener('pd-user-ready', function () {
    boot();
    var user = window.pdUser || {};
    if (user.userId && PD.fetchRealAppointments) {
      PD.fetchRealAppointments(user.userId).then(function (res) {
        if (res) { loadState(); applyFilters(); }
      });
    }
  });

  if (window.pdUser) boot();
})();