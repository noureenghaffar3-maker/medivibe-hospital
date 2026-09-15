/* MediVibe - Client Dashboard */
(function () {
  var mv = window.mvFirebase;
  var auth = mv.auth;
  var db = mv.db;
  var MV = window.MV || {};
  var DOCTORS = MV.DOCTORS || [];
  var BOOKABLE_DEPARTMENTS = MV.BOOKABLE_DEPARTMENTS || [];
  var TIME_SLOTS = MV.TIME_SLOTS || [];

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function fmtDate(iso) {
    if (!iso) return '-';
    var parts = iso.split('-');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: parts[2], mon: months[parseInt(parts[1], 10) - 1] || parts[1], full: iso };
  }
  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function formatFullDate(iso) {
    var f = fmtDate(iso);
    if (f.full === '-') return '-';
    var d = new Date(iso + 'T00:00:00');
    var opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return isNaN(d.getTime()) ? f.full : d.toLocaleDateString('en-US', opts);
  }
  function statusClass(s) { return 'status-' + (s || 'pending'); }
  function initialsOf(name) {
    return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }
  function showMsg(el, text, type) {
    el.textContent = text || '';
    el.className = 'auth-message show ' + (type || 'error');
  }

  var currentUser = null;
  var userProfile = null;
  var allAppointments = [];

  /* ---------- section navigation ---------- */
  function goToSection(name) {
    document.querySelectorAll('.dash-side-link').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === name);
    });
    document.querySelectorAll('.dash-section').forEach(function (s) { s.classList.remove('active'); });
    var sec = $('section-' + name);
    if (sec) sec.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.dash-side-link').forEach(function (btn) {
    btn.addEventListener('click', function () { goToSection(btn.getAttribute('data-section')); });
  });
  document.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function () { goToSection(btn.getAttribute('data-go')); });
  });

  /* ---------- avatar + greeting ---------- */
  function paintUser() {
    var initials = (userProfile && userProfile.initials) || initialsOf((userProfile && userProfile.displayName) || (currentUser && currentUser.email) || 'U');
    function avatarHtml(url) {
      return url
        ? '<img src="' + url + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
        : initials;
    }
    $('top-avatar').innerHTML = avatarHtml(currentUser && currentUser.photoURL);
    $('side-avatar').innerHTML = avatarHtml(currentUser && currentUser.photoURL);
    $('prof-avatar').innerHTML = avatarHtml(currentUser && currentUser.photoURL);
    $('top-name').textContent = (userProfile && userProfile.displayName) || (currentUser && currentUser.displayName) || 'Patient';
    $('side-name').textContent = (userProfile && userProfile.displayName) || (currentUser && currentUser.displayName) || 'Patient';
    $('side-email').textContent = (currentUser && currentUser.email) || '';
    $('prof-name').textContent = (userProfile && userProfile.displayName) || 'Patient';
    $('prof-email').textContent = (currentUser && currentUser.email) || '';
    var first = ((userProfile && userProfile.displayName) || 'there').split(' ')[0];
    $('overview-hello').textContent = 'Welcome back, ' + first + ' 👋';
  }

  /* ---------- appointments ---------- */
  async function loadAppointments() {
    if (!db || !currentUser) return;
    var list = $('appointments-list');
    list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading appointments...</p></div>';
    try {
      var snap = await db.collection('appointments').where('userId', '==', currentUser.uid).get();
      allAppointments = [];
      snap.forEach(function (d) {
        allAppointments.push(Object.assign({ id: d.id }, d.data()));
      });
      renderOverviewStats();
      var activeFilter = document.querySelector('.filter-tab.active');
      var mode = activeFilter ? activeFilter.getAttribute('data-filter') : 'upcoming';
      renderAppointments(mode);
      renderOverviewList();
    } catch (err) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>Could not load appointments.</p><small>' + mv.getErrorMessage(err) + '</small></div>';
    }
  }

  function filterAppointments(mode) {
    var today = todayISO();
    var up = function (a) { return a.status !== 'cancelled' && a.status !== 'completed' && String(a.date || '') >= today; };
    var past = function (a) { return a.status === 'completed' || (String(a.date || '') < today && a.status !== 'cancelled'); };
    if (mode === 'upcoming') return allAppointments.filter(up).sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
    if (mode === 'past') return allAppointments.filter(past).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    if (mode === 'cancelled') return allAppointments.filter(function (a) { return a.status === 'cancelled'; }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    return allAppointments.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }

  function appointmentItemHTML(appt) {
    var f = fmtDate(appt.date);
    var cancelled = appt.status === 'cancelled';
    var completed = appt.status === 'completed';
    var blockClass = cancelled ? 'cancelled' : (completed ? 'completed' : '');
    var cancellable = !cancelled && !completed && String(appt.date || '') >= todayISO();

    return '' +
      '<div class="appt-item">' +
      '  <div class="appt-date-block ' + blockClass + '">' +
      '    <div class="ad-day">' + (f.day === '-' ? '—' : f.day) + '</div>' +
      '    <div class="ad-mon">' + f.mon + '</div>' +
      '  </div>' +
      '  <div class="appt-info">' +
      '    <h4>' + (appt.doctorName || 'Doctor') + ' · ' + (appt.department || '') + '</h4>' +
      '    <p><i class="fa-regular fa-calendar-days"></i>' + formatFullDate(appt.date) + ' &nbsp; <i class="fa-regular fa-clock"></i>' + (appt.time || '-') + '</p>' +
      (appt.notes ? '    <p><i class="fa-solid fa-note-sticky"></i>' + appt.notes + '</p>' : '') +
      '  </div>' +
      '  <div class="appt-actions">' +
      '    <span class="status-badge ' + statusClass(appt.status) + '">' + (appt.status || 'pending') + '</span>' +
      (cancellable ? '    <button class="mini-btn cancel" data-cancel="' + appt.id + '">Cancel</button>' : '') +
      '  </div>' +
      '</div>';
  }

  function renderAppointments(mode) {
    var list = $('appointments-list');
    var items = filterAppointments(mode);
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>No ' + mode + ' appointments.</p><small>Book a new appointment from the Book section.</small></div>';
      return;
    }
    list.innerHTML = items.map(appointmentItemHTML).join('');
    list.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { cancelAppointment(btn.getAttribute('data-cancel'), btn); });
    });
  }

  async function cancelAppointment(id, btn) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    btn.disabled = true;
    btn.textContent = 'Cancelling…';
    try {
      await db.collection('appointments').doc(id).update({ status: 'cancelled' });
      await loadAppointments();
    } catch (err) {
      alert(mv.getErrorMessage(err));
      btn.disabled = false;
      btn.textContent = 'Cancel';
    }
  }

  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderAppointments(tab.getAttribute('data-filter'));
    });
  });

  /* ---------- overview ---------- */
  function renderOverviewStats() {
    var today = todayISO();
    $('stat-upcoming').textContent = allAppointments.filter(function (a) {
      return a.status !== 'cancelled' && a.status !== 'completed' && String(a.date || '') >= today;
    }).length;
    $('stat-pending').textContent = allAppointments.filter(function (a) { return a.status === 'pending'; }).length;
    $('stat-completed').textContent = allAppointments.filter(function (a) { return a.status === 'completed'; }).length;
  }

  function renderOverviewList() {
    var wrap = $('ov-upcoming');
    var upcoming = filterAppointments('upcoming').slice(0, 5);
    if (!upcoming.length) {
      wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-check"></i><p>No upcoming appointments.</p><small>Book one now and we\'ll take care of the rest.</small></div>';
      return;
    }
    wrap.innerHTML = upcoming.map(appointmentItemHTML).join('');
    wrap.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { cancelAppointment(btn.getAttribute('data-cancel'), btn); });
    });
  }

  /* ---------- book appointment ---------- */
  function populateBookForm() {
    var deptSel = $('book-department');
    var docSel = $('book-doctor');
    var timeSel = $('book-time');

    deptSel.innerHTML = '<option value="">Select department</option>' +
      BOOKABLE_DEPARTMENTS.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');

    timeSel.innerHTML = '<option value="">Select time</option>' +
      TIME_SLOTS.map(function (t) { return '<option>' + t + '</option>'; }).join('');

    deptSel.addEventListener('change', function () {
      var dept = deptSel.value;
      var docs = dept ? DOCTORS.filter(function (d) { return d.department === dept; }) : [];
      docSel.innerHTML = docs.length
        ? '<option value="">Select doctor</option>' + docs.map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('')
        : '<option value="">No doctors in this department</option>';
    });

    $('book-date').min = todayISO();
  }

  function presetBook(doctorId) {
    var doctor = DOCTORS.filter(function (d) { return d.id === doctorId; })[0];
    if (!doctor) return;
    var deptSel = $('book-department');
    var docSel = $('book-doctor');
    deptSel.value = doctor.department;
    deptSel.dispatchEvent(new Event('change'));
    docSel.value = doctor.id;
    goToSection('book');
  }

  $('book-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(this);
    var msg = $('book-msg');
    msg.className = 'auth-message';
    var doctor = DOCTORS.filter(function (d) { return d.id === $('book-doctor').value; })[0];
    var date = $('book-date').value;
    var time = $('book-time').value;

    if (!$('book-doctor').value) return showMsg(msg, 'Please select a doctor.', 'error');
    if (!date) return showMsg(msg, 'Please choose a date.', 'error');
    if (!time) return showMsg(msg, 'Please select a time slot.', 'error');

    var btn = $('book-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Booking…';
    try {
      await db.collection('appointments').add({
        userId: currentUser.uid,
        patientName: (userProfile && userProfile.displayName) || (currentUser.displayName || ''),
        patientEmail: currentUser.email || '',
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        date: date,
        time: time,
        notes: $('book-notes').value.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      showMsg(msg, 'Appointment requested! You will get confirmation soon.', 'success');
      this.reset();
      await loadAppointments();
      setTimeout(function () { goToSection('appointments'); }, 1200);
    } catch (err) {
      showMsg(msg, mv.getErrorMessage(err), 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Confirm Booking <i class="fa-solid fa-chevron-right"></i>';
    }
  });

  /* ---------- doctors ---------- */
  function renderDoctors(list) {
    var wrap = $('doctors-list');
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-user-doctor"></i><p>No doctors found.</p><small>Try a different search term.</small></div>';
      return;
    }
    wrap.innerHTML = list.map(function (d) {
      var bookable = BOOKABLE_DEPARTMENTS.indexOf(d.department) !== -1;
      var action = bookable
        ? '<button class="book-btn" data-doctor-id="' + d.id + '">Book Appointment</button>'
        : '<button class="book-btn" disabled style="opacity:.45;cursor:not-allowed;" title="Administrative doctor - not available for direct booking">Administration Team</button>';
      return '' +
        '<div class="doctor-tile">' +
        '  <img src="' + d.image + '" alt="' + d.name + '">' +
        '  <h4>' + d.name + '</h4>' +
        '  <div class="dd-role">' + d.designation + ' · ' + d.department + '</div>' +
        '  <div class="dd-meta">' +
        '    <span><i class="fa-solid fa-briefcase-medical"></i>' + d.experience + ' experience</span>' +
        '    <span><i class="fa-solid fa-graduation-cap"></i>' + d.qualifications + '</span>' +
        '    <span><i class="fa-solid fa-calendar-days"></i>' + d.days + '</span>' +
        '    <span><i class="fa-regular fa-clock"></i>' + d.timings + '</span>' +
        '  </div>' +
        action +
        '</div>';
    }).join('');
    wrap.querySelectorAll('[data-doctor-id]').forEach(function (btn) {
      btn.addEventListener('click', function () { presetBook(btn.getAttribute('data-doctor-id')); });
    });
  }

  function applyDoctorFilters() {
    var term = $('doc-search').value.trim().toLowerCase();
    var dept = $('doc-dept-filter').value;
    var list = DOCTORS;
    if (dept) list = list.filter(function (d) { return d.department === dept; });
    if (term) list = list.filter(function (d) {
      return (d.name + ' ' + d.designation + ' ' + d.department + ' ' + d.qualifications).toLowerCase().indexOf(term) !== -1;
    });
    renderDoctors(list);
  }

  $('doc-search').addEventListener('input', applyDoctorFilters);
  $('doc-dept-filter').addEventListener('change', applyDoctorFilters);

  /* ---------- medical records ---------- */
  async function loadRecords() {
    if (!db || !currentUser) return;
    var wrap = $('records-list');
    wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading records...</p></div>';
    try {
      var snap = await db.collection('medicalRecords').where('userId', '==', currentUser.uid).get();
      var records = [];
      snap.forEach(function (d) { records.push(Object.assign({ id: d.id }, d.data())); });
      records.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      $('stat-records').textContent = records.length;
      $('records-title').textContent = 'My Records (' + records.length + ')';
      if (!records.length) {
        wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No medical records yet.</p><small>Click "+ Add Record" to save your first health record.</small></div>';
        return;
      }
      var icons = {
        'Prescription': 'fa-pills', 'Lab Report': 'fa-flask', 'X-Ray / Scan': 'fa-x-ray',
        'Vaccination': 'fa-syringe', 'Consultation': 'fa-stethoscope', 'Other': 'fa-file-medical'
      };
      wrap.innerHTML = records.map(function (r) {
        return '' +
          '<div class="record-item">' +
          '  <span class="record-icon"><i class="fa-solid ' + (icons[r.recordType] || 'fa-file-medical') + '"></i></span>' +
          '  <div class="record-info">' +
          '    <h4>' + (r.title || 'Record') + '</h4>' +
          '    <p><i class="fa-regular fa-calendar-days"></i> ' + formatFullDate(r.date) +
          (r.doctor ? ' · <i class="fa-solid fa-user-doctor"></i> ' + r.doctor : '') +
          (r.recordType ? ' · <span class="status-badge status-confirmed">' + r.recordType + '</span>' : '') + '</p>' +
          (r.notes ? '    <p style="color:#98a2ad;">' + r.notes + '</p>' : '') +
          '  </div>' +
          '  <div class="appt-actions">' +
          '    <button class="mini-btn delete" data-record-id="' + r.id + '"><i class="fa-regular fa-trash-can"></i></button>' +
          '  </div>' +
          '</div>';
      }).join('');
      wrap.querySelectorAll('[data-record-id]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteRecord(btn.getAttribute('data-record-id')); });
      });
    } catch (err) {
      wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>Could not load records.</p><small>' + mv.getErrorMessage(err) + '</small></div>';
    }
  }

  async function deleteRecord(id) {
    if (!confirm('Delete this medical record?')) return;
    try {
      await db.collection('medicalRecords').doc(id).delete();
      loadRecords();
    } catch (err) {
      alert(mv.getErrorMessage(err));
    }
  }

  $('toggle-record-form').addEventListener('click', function () {
    var form = $('record-form');
    form.style.display = form.style.display === 'none' ? '' : 'none';
  });

  $('rec-cancel').addEventListener('click', function () {
    $('record-form').style.display = 'none';
    $('record-form').reset();
  });

  $('record-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(this);
    var title = $('rec-title').value.trim();
    var date = $('rec-date').value;
    if (!title) return $('rec-title').focus();
    if (!date) return $('rec-date').focus();
    var btn = $('rec-save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      await db.collection('medicalRecords').add({
        userId: currentUser.uid,
        recordType: $('rec-type').value,
        title: title,
        doctor: $('rec-doctor').value.trim(),
        date: date,
        notes: $('rec-notes').value.trim(),
        createdAt: new Date().toISOString()
      });
      this.reset();
      $('record-form').style.display = 'none';
      $('toggle-record-form').textContent = '+ Add Record';
      await loadRecords();
    } catch (err) {
      alert(mv.getErrorMessage(err));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Record';
    }
  });

  /* ---------- profile ---------- */
  function renderProfileForm() {
    if (!userProfile) return;
    $('pf-name').value = userProfile.displayName || '';
    $('pf-phone').value = userProfile.phone || '';
    $('pf-gender').value = userProfile.gender || '';
    $('pf-dob').value = userProfile.dob || '';
    $('pf-blood').value = userProfile.bloodGroup || '';
    $('pf-emergency').value = userProfile.emergencyContact || '';
    $('pf-address').value = userProfile.address || '';
    $('pf-allergies').value = userProfile.allergies || '';
  }

  function showProfileMsg(text, type) {
    var m = $('profile-msg');
    m.textContent = text || '';
    m.className = 'auth-message show ' + (type || 'error');
  }

  $('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(this);
    var btn = $('profile-save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    var name = $('pf-name').value.trim();
    var data = {
      displayName: name,
      phone: $('pf-phone').value.trim(),
      gender: $('pf-gender').value,
      dob: $('pf-dob').value,
      bloodGroup: $('pf-blood').value,
      emergencyContact: $('pf-emergency').value.trim(),
      address: $('pf-address').value.trim(),
      allergies: $('pf-allergies').value.trim(),
      initials: initialsOf(name)
    };
    try {
      await db.collection('users').doc(currentUser.uid).update(data);
      userProfile = Object.assign({}, userProfile, data);
      paintUser();
      showProfileMsg('Profile updated successfully.', 'success');
      setTimeout(function () { showProfileMsg('', ''); }, 2500);
    } catch (err) {
      showProfileMsg(mv.getErrorMessage(err));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });

  $('password-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(this);
    var msg = $('pw-msg');
    msg.className = 'auth-message';
    var current = $('pw-current').value;
    var next = $('pw-new').value;
    if (!current) return showMsg(msg, 'Enter your current password.', 'error');
    if (next.length < 6) return showMsg(msg, 'New password must be at least 6 characters.', 'error');
    var btn = $('pw-btn');
    btn.disabled = true;
    btn.textContent = 'Updating…';
    try {
      var user = auth.currentUser;
      var cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(next);
      this.reset();
      showMsg(msg, 'Password updated successfully.', 'success');
      setTimeout(function () { showMsg(msg, '', ''); }, 3000);
    } catch (err) {
      showMsg(msg, mv.getErrorMessage(err), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });

  /* ---------- logout ---------- */
  $('logout-btn').addEventListener('click', function () {
    if (auth) {
      auth.signOut().then(function () {
        window.location.href = 'auth.html';
      });
    }
  });

  /* ---------- boot ---------- */
  var sectionParam = new URLSearchParams(window.location.search).get('section');
  if (sectionParam) goToSection(sectionParam);

  populateBookForm();
  $('doc-dept-filter').innerHTML = '<option value="">All departments</option>' +
    BOOKABLE_DEPARTMENTS.map(function (d) { return '<option>' + d + '</option>'; }).join('');
  if (DOCTORS.length) renderDoctors(DOCTORS);

  if (mv.configMissing) {
    mv.warnIfNotConfigured(document.body);
    $('side-name').textContent = 'Firebase setup required';
    $('side-email').textContent = 'See firebase-config.js';
  } else if (auth) {
    auth.onAuthStateChanged(async function (user) {
      if (!user) {
        window.location.href = 'auth.html?returnTo=' + encodeURIComponent('dashboard.html');
        return;
      }
      currentUser = user;
      var ref = db.collection('users').doc(user.uid);
      var snap = await ref.get();
      userProfile = snap.exists
        ? Object.assign({ initials: initialsOf(user.displayName || user.email) }, snap.data())
        : { displayName: user.displayName || user.email.split('@')[0], email: user.email, phone: '' };
      if (!userProfile.initials || userProfile.initials === '') {
        userProfile.initials = initialsOf(userProfile.displayName);
      }
      paintUser();
      renderProfileForm();
      loadAppointments();
      loadRecords();
    });
  }
})();