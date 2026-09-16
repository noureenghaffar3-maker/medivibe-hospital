/* =========================================================
   MediVibe Patient Dashboard - Settings/profile logic
   ========================================================= */
(function () {
  var PD = window.PD || {};
  var mv = window.mvFirebase;
  var db = mv ? mv.db : null;
  var auth = mv ? mv.auth : null;

  function $(id) { return document.getElementById(id); }

  function show(el, msg, type) {
    el.textContent = msg || '';
    el.className = type === 'success' ? 'success-msg show' : 'err-msg show';
  }

  function initialsOf(name) {
    return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  /* ---------- profile fill ---------- */
  function fillFromUser() {
    var user = window.pdUser || {};
    var p = user.profile || {};
    var name = user.name || (user.email || 'Patient').split('@')[0];
    $('stName').value = p.displayName || (user.name || '');
    $('stPhone').value = p.phone || '';
    $('stEmail').value = user.email || '';
    $('stBlood').value = p.bloodGroup || '';
    $('stEmergency').value = p.emergencyContact || '';
    $('stGender').value = p.gender || '';
    $('stDob').value = p.dob || '';
    $('stAllergies').value = p.allergies || '';
  }

  document.addEventListener('pd-user-ready', fillFromUser);
  if (window.pdUser) fillFromUser();

  /* ---------- save profile ---------- */
  $('stSaveBtn').addEventListener('click', function () {
    var name = $('stName').value.trim();
    var nSuccess = $('stSuccess'), nError = $('stError');
    show(nSuccess, '', ''); show(nError, '', '');

    if (!name) { show(nError, 'Please enter your full name.'); return; }

    var data = {
      displayName: name,
      phone: $('stPhone').value.trim(),
      gender: $('stGender').value,
      dob: $('stDob').value,
      bloodGroup: $('stBlood').value,
      emergencyContact: $('stEmergency').value.trim(),
      allergies: $('stAllergies').value.trim(),
      initials: initialsOf(name)
    };

    var done = function () {
      show(nSuccess, 'Profile saved successfully.', 'success');
      setTimeout(function () { show(nSuccess, '', ''); }, 2500);
      if (window.pdToast) window.pdToast('Profile updated!', 'success');
    };

    if (db && window.pdUser && window.pdUser.userId && PD.isFirebaseReady()) {
      db.collection('users').doc(window.pdUser.userId).set(data, { merge: true })
        .then(done)
        .catch(function (err) { show(nError, mv ? mv.getErrorMessage(err) : 'Error saving profile.'); });
    } else {
      // demo mode: keep in memory
      window.pdUser.profile = data;
      window.pdUser.name = name;
      done();
    }
  });

  /* ---------- avatar upload ---------- */
  $('avatarUploadBtn').addEventListener('click', function () { $('avatarFileInput').click(); });
  $('avatarFileInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { if (window.pdToast) window.pdToast('Image too large (max 2MB).', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      document.querySelectorAll('[data-pd-avatar]').forEach(function (el) {
        el.innerHTML = '<img src="' + ev.target.result + '" alt="avatar">';
      });
      if (window.pdToast) window.pdToast('Profile photo updated (draft).', 'success');
    };
    reader.readAsDataURL(file);
  });

  /* ---------- password strength + change ---------- */
  $('pwNew').addEventListener('input', function () {
    var v = $('pwNew').value;
    var bar = $('pwBar'), hint = $('pwHint');
    var strength = 0;
    if (v.length >= 6) strength++;
    if (v.length >= 10) strength++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) strength++;
    if (strength === 0) { bar.style.width = '0'; bar.style.background = 'transparent'; hint.textContent = ''; return; }
    var colors = ['#d97706', '#d97706', '#16a34a'];
    var labels = ['Weak', 'Good', 'Strong'];
    bar.style.width = (33 + strength * 22) + '%';
    bar.style.background = colors[Math.min(strength - 1, 2)];
    hint.textContent = 'Strength: ' + labels[Math.min(strength - 1, 2)];
  });

  $('pwSaveBtn').addEventListener('click', function () {
    var cur = $('pwCurrent').value;
    var next = $('pwNew').value;
    var s = $('pwSuccess'), e = $('pwError');
    show(s, '', ''); show(e, '', '');

    if (!cur) { show(e, 'Enter your current password.'); return; }
    if (next.length < 6) { show(e, 'New password must be at least 6 characters.'); return; }

    var done = function () {
      $('pwCurrent').value = ''; $('pwNew').value = '';
      $('pwBar').style.width = '0'; $('pwHint').textContent = '';
      show(s, 'Password updated successfully.', 'success');
      setTimeout(function () { show(s, '', ''); }, 3000);
    };

    if (auth && window.mvFirebase && !window.mvFirebase.configMissing) {
      var user = auth.currentUser;
      if (!user) { show(e, 'Login required.'); return; }
      var cred = firebase.auth.EmailAuthProvider.credential(user.email, cur);
      user.reauthenticateWithCredential(cred).then(function () {
        return user.updatePassword(next);
      }).then(done).catch(function (err) {
        show(e, mv.getErrorMessage(err));
      });
    } else {
      done();
    }
  });

  /* ---------- 2FA toggle demo ---------- */
  $('twoFaToggle').addEventListener('change', function () {
    if (window.pdToast) window.pdToast(this.checked ? '2FA enabled (demo).' : '2FA disabled.', 'success');
  });

  /* ---------- boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillFromUser);
  }
})();