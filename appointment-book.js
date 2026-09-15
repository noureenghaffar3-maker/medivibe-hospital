/* MediVibe - Appointment page booking (saves to Firestore) */
(function () {
  var mv = window.mvFirebase;
  if (!mv) return;
  var db = mv.db;
  var auth = mv.auth;

  var form = document.querySelector('.appointment-form');
  var loginReady = false;

  function ensureBanner() {
    if (!form) return null;
    var banner = document.getElementById('appointment-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'appointment-banner';
      banner.style.cssText = 'margin-top:14px;padding:10px 14px;border-radius:10px;font-size:13.5px;font-weight:600;display:none;';
      var sub = form.querySelector('.form-submit');
      (sub || form).appendChild(banner);
    }
    return banner;
  }

  function showBanner(text, type) {
    var banner = ensureBanner();
    if (!banner) return;
    banner.textContent = text || '';
    banner.style.display = text ? 'block' : 'none';
    banner.style.background = type === 'error' ? '#fdecea' : (type === 'success' ? '#eafaf1' : '#e8f4fd');
    banner.style.color = type === 'error' ? '#a93226' : (type === 'success' ? '#1e8449' : '#2563eb');
    banner.style.border = '1px solid ' + (type === 'error' ? '#f5c6c2' : (type === 'success' ? '#b8e6c8' : '#bfdcf5'));
  }

  function prefillFromStorage() {
    var raw = sessionStorage.getItem('mv_pending_appointment');
    if (!raw || !form) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    function set(name, value) {
      var inp = form.querySelector('[name="' + name + '"]');
      if (inp && value) inp.value = value;
    }
    set('name', data.name);
    set('email', data.email);
    set('phone', data.phone);
    set('department', data.department);
    set('date', data.date);
    set('time', data.time);
    var notes = form.querySelector('[name="notes"]');
    if (notes && data.notes) notes.value = data.notes;
    sessionStorage.removeItem('mv_pending_appointment');
    showBanner('You are now logged in. Your details have been carried over — please review and confirm your booking.', 'info');
  }

  if (form) {
    if (!mv.configMissing) {
      auth.onAuthStateChanged(function (user) {
        loginReady = !!user;
        if (user) prefillFromStorage();
        else showBanner('');
      });
    }
  }

  window.MediVibe = window.MediVibe || {};
  window.MediVibe.bookAppointment = async function (data, btn) {
    if (!mv.isConfigReady()) {
      showBanner('Firebase configured nahi hai — README me steps follow karke firebase-config.js update karo.', 'error');
      return;
    }
    if (!loginReady || !auth.currentUser) {
      sessionStorage.setItem('mv_pending_appointment', JSON.stringify(data));
      window.location.href = 'auth.html?returnTo=appointment.html';
      return;
    }

    var original = btn.textContent;
    btn.textContent = 'Booking...';
    btn.disabled = true;
    showBanner('');

    try {
      await db.collection('appointments').add({
        userId: auth.currentUser.uid,
        patientName: data.name,
        patientEmail: data.email || auth.currentUser.email,
        phone: data.phone,
        department: data.department,
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      btn.textContent = 'Appointment Booked!';
      btn.style.background = '#0dcaf0';
      form.reset();
      showBanner('Appointment request submitted! You can track its status anytime from your dashboard.', 'success');
      setTimeout(function () {
        btn.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 4000);
    } catch (err) {
      btn.textContent = original;
      btn.disabled = false;
      showBanner(mv.getErrorMessage(err), 'error');
    }
  };
})();