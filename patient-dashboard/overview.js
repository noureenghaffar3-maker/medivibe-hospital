/* =========================================================
   MediVibe Patient Dashboard - Overview page logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  function initialsOf(name) {
    return (name || 'Dr').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(String(iso) + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function statusPill(status) {
    var st = (status || 'scheduled').toLowerCase();
    var cls = { scheduled: 'scheduled', pending: 'pending', completed: 'completed', 'checked-out': 'checked-out', cancelled: 'cancelled', confirmed: 'scheduled' };
    var label = (cls[st] ? st : 'scheduled');
    var map = { scheduled: 'Scheduled', 'checked-out': 'Checked Out', completed: 'Completed', cancelled: 'Cancelled', pending: 'Pending' };
    return '<span class="status-pill ' + (cls[st] || 'scheduled') + '">' + (map[label] || 'Scheduled') + '</span>';
  }

  function avatarOf(scope, initials, photo, name) {
    return '<div class="avatar" style="background:#dbe9ff;color:#135dd8;">' +
      (photo ? '<img src="' + photo + '" alt="' + name + '">' : initials) + '</div>';
  }

  /* ---------- KPI cards ---------- */
  function renderKpis(appts) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    function upcomingCount(list) {
      return list.filter(function (a) {
        var st = (a.status || '').toLowerCase();
        if (st === 'completed' || st === 'cancelled') return false;
        var d = a.date ? new Date(String(a.date) + 'T00:00:00') : null;
        return d ? d >= today : true;
      }).length;
    }

    $('kpi-appts').textContent = appts.length;
    $('kpi-appts-sub').textContent = upcomingCount(appts);
    $('kpi-online').textContent = appts.filter(function (a) {
      return (a.type || '').toLowerCase() === 'online';
    }).length;

    // latest vitals
    var vitals = PD.getVitals ? PD.getVitals() : [];
    if (vitals.length) {
      var latest = vitals[0];
      $('kpi-bp').textContent = latest.bp;
      $('kpi-hr').textContent = latest.hr + ' bpm';
      var bpHigh = parseInt((latest.bp || '0').split('/')[0], 10) >= 130;
      var bpStatus = $('kpi-bp-status');
      bpStatus.textContent = bpHigh ? 'Slightly High' : 'Normal';
      bpStatus.className = 'vitals-badge ' + (bpHigh ? 'high' : 'normal');
      var hrHigh = latest.hr >= 85;
      var hrStatus = $('kpi-hr-status');
      hrStatus.textContent = hrHigh ? 'Elevated' : 'Healthy';
      hrStatus.className = 'vitals-badge ' + (hrHigh ? 'warn' : 'normal');
    }
  }

  /* ---------- My doctors (bookable subset) ---------- */
  function renderMyDoctors(doctors) {
    var wrap = $('myDoctors');
    var list = doctors.slice(0, 4);
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state"><p>No doctors yet.</p></div>';
      return;
    }
    wrap.innerHTML = list.map(function (d) {
      return '<div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid #eef1f6;">' +
        avatarOf('doc', initialsOf(d.name), d.image, d.name) +
        '<div style="flex:1;">' +
        '  <div style="font-weight:600;font-size:0.9rem;">' + d.name + '</div>' +
        '  <div style="font-size:0.78rem;color:#64748b;">' + (d.department || d.specialty || d.designation || 'Doctor') + ' · <span style="color:#135dd8;">' + (d.experience || '8+ yrs') + '</span></div>' +
        '</div>' +
        '<a href="appointments.html" class="mini-btn primary-med"><i class="fa-solid fa-calendar-plus"></i> Book</a>' +
        '</div>';
    }).join('');
  }

  /* ---------- Prescriptions overview ---------- */
  function renderPrescriptions() {
    var wrap = $('presOverview');
    var list = (PD.getPrescriptions ? PD.getPrescriptions() : []).filter(function (p) {
      return (p.status || '').toLowerCase() === 'active';
    });
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-prescription"></i><p>No active prescriptions.</p></div>';
      return;
    }
    wrap.innerHTML = list.map(function (p) {
      var meds = (p.items || []).map(function (m) {
        return '<div class="d-flex justify-content-between" style="font-size:0.85rem;padding:6px 0;border-bottom:1px dashed #eef1f6;">' +
          '<span style="font-weight:600;">' + m.name + '</span>' +
          '<span class="text-muted">' + m.dosage + '</span></div>';
      }).join('');
      return '<div class="p-3 mb-3 rounded" style="background:#f7fafc;border:1px solid #eef1f6;">' +
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
        '  <span style="font-weight:700;font-size:0.9rem;">' + p.doctor + ' <small class="text-muted" style="font-weight:400;">(' + p.specialty + ')</small></span>' +
        '  <span class="status-pill scheduled">Active</span>' +
        '</div>' + meds +
        '</div>';
    }).join('');
  }

  /* ---------- Recent appointments table ---------- */
  function renderRecentAppts(appts) {
    var body = $('recentApptBody');
    var list = appts.slice(0, 6);
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>No appointments yet.</p></div></td></tr>';
      return;
    }
    body.innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td><div class="doc-cell">' + avatarOf('a', a.avatar || initialsOf(a.doctorName)) +
        '  <div><div class="doc-name">' + a.doctorName + '</div><div class="doc-sub">' + a.specialty + '</div></div></div></td>' +
        '<td><div style="font-weight:600;">' + fmtDate(a.date) + '</div><div class="doc-sub">' + a.time + '</div></td>' +
        '<td>' + (a.type === 'Online'
          ? '<span class="status-pill checked-out"><i class="fa-solid fa-video"></i> Online</span>'
          : '<span class="status-pill"><i class="fa-solid fa-hospital"></i> In-Person</span>') + '</td>' +
        '<td>' + statusPill(a.status) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ---------- Activity timeline ---------- */
  function renderActivity() {
    var wrap = $('activityTimeline');
    var list = (PD.getActivity ? PD.getActivity() : []);
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state"><p>No activity yet.</p></div>';
      return;
    }
    wrap.innerHTML = list.map(function (a) {
      return '<div class="act-item ' + (a.color || '') + '">' +
        '<div class="act-txt"><i class="fa-solid ' + a.icon + '" style="margin-right:6px;color:#135dd8;"></i>' + a.text + '</div>' +
        '<div class="act-time">' + a.time + '</div></div>';
    }).join('');
  }

  /* ---------- boot ---------- */
  function renderAll() {
    var appts = PD.getAppointments ? PD.getAppointments() : [];
    renderKpis(appts);
    renderRecentAppts(appts);
    renderMyDoctors(PD.getDoctors ? PD.getDoctors() : []);
    renderPrescriptions();
    renderActivity();
  }

  var started = false;
  document.addEventListener('pd-user-ready', function () {
    if (started) return;
    started = true;
    var user = window.pdUser || {};
    if (user.userId && PD.fetchRealAppointments) {
      PD.fetchRealAppointments(user.userId).then(function () {
        renderAll();
      });
    } else {
      renderAll();
    }
  });

  // fallback in case event fired before listener
  if (window.pdUser && !started) {
    started = true;
    renderAll();
  }
})();