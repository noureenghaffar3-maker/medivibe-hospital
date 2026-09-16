/* MediVibe - Auth page (Login / Sign Up / Google / Forgot password) */
(function () {
  var mv = window.mvFirebase;
  var auth = mv.auth;
  var db = mv.db;
  if (!auth && !mv.configMissing) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var returnToRaw = params.get('returnTo') || 'patient-dashboard/patient-dashboard.html';
  var returnTo = returnToRaw.indexOf('://') === -1 ? returnToRaw : 'patient-dashboard/patient-dashboard.html';

  /* session already logged in hone par bhi auto-redirect ke liye, magar
     signup/login ke in-flight operation me user-document banne se pehle
     redirect na ho isliye flag use karte hain */
  var authRedirectBlocked = false;

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  var loginTab = $('tab-login');
  var signupTab = $('tab-signup');
  var loginForm = $('login-form');
  var signupForm = $('signup-form');
  var loginMsg = $('login-msg');
  var signupMsg = $('signup-msg');

  function showMsg(el, text, type) {
    el.textContent = text || '';
    el.className = 'auth-message show ' + (type || 'error');
    if (!text) el.className = 'auth-message';
  }

  function setBusy(btn, busy, text) {
    btn.disabled = busy;
    btn.innerHTML = busy
      ? '<i class="fa-solid fa-spinner fa-spin"></i> ' + text
      : text;
  }

  function switchTab(which) {
    var isLogin = which === 'login';
    loginTab.classList.toggle('active', isLogin);
    signupTab.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('active', isLogin);
    signupForm.classList.toggle('active', !isLogin);
    showMsg(loginMsg, '');
    showMsg(signupMsg, '');
  }

  function markInvalid(input) {
    input.classList.add('form-control-error');
  }
  function markValid(input) {
    input.classList.remove('form-control-error');
  }

  async function ensureUserDoc(user, profile) {
    if (!db) return;
    var ref = db.collection('users').doc(user.uid);
    var snap = await ref.get();
    if (!snap.exists) {
      await ref.set(profile);
    } else {
      var data = snap.data();
      if (!data.displayName && profile.displayName) {
        await ref.set(Object.assign({}, data, { displayName: profile.displayName }), { merge: true });
      }
    }
  }

  function redirectAfterAuth() {
    window.location.href = returnTo;
  }

  /* ---------- login ---------- */
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(loginForm);
    authRedirectBlocked = true;
    var email = $('login-email').value.trim();
    var password = $('login-password').value;
    if (!email) return markInvalid($('login-email'));
    if (!password) return markInvalid($('login-password'));

    var btn = $('login-btn');
    setBusy(btn, true, 'Logging in...');
    showMsg(loginMsg, '');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showMsg(loginMsg, 'Login successful! Redirecting...', 'success');
      setTimeout(redirectAfterAuth, 600);
    } catch (err) {
      showMsg(loginMsg, mv.getErrorMessage(err));
    } finally {
      setBusy(btn, false, 'Login <i class="fa-solid fa-arrow-right-to-bracket"></i>');
    }
  });

  /* ---------- signup ---------- */
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(signupForm);
    authRedirectBlocked = true;

    var name = $('su-name').value.trim();
    var email = $('su-email').value.trim();
    var phone = $('su-phone').value.trim();
    var password = $('su-password').value;
    var confirm = $('su-confirm').value;

    if (!name) return markInvalid($('su-name'));
    if (!email) return markInvalid($('su-email'));
    if (!phone) return markInvalid($('su-phone'));
    if (password.length < 6) { markInvalid($('su-password')); return showMsg(signupMsg, 'Password should be at least 6 characters.'); }
    if (password !== confirm) { markInvalid($('su-confirm')); return showMsg(signupMsg, 'Passwords do not match.'); }

    $('su-password').addEventListener('input', function () { markValid($('su-password')); });
    $('su-confirm').addEventListener('input', function () { markValid($('su-confirm')); });

    var btn = $('signup-btn');
    setBusy(btn, true, 'Creating account...');
    showMsg(signupMsg, '');
    try {
      var cred = await auth.createUserWithEmailAndPassword(email, password);
      var user = cred.user;
      var initials = name.split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
      await ensureUserDoc(user, {
        displayName: name,
        email: user.email || email,
        phone: phone,
        initials: initials,
        role: 'patient',
        createdAt: new Date().toISOString(),
        gender: '',
        dob: '',
        bloodGroup: '',
        address: '',
        emergencyContact: '',
        allergies: ''
      });
      showMsg(signupMsg, 'Account created! Redirecting...', 'success');
      setTimeout(redirectAfterAuth, 900);
    } catch (err) {
      showMsg(signupMsg, mv.getErrorMessage(err));
    } finally {
      setBusy(btn, false, 'Create Account <i class="fa-solid fa-user-plus"></i>');
    }
  });

  /* ---------- Google (both tabs) ---------- */
  async function handleGoogle(btn, msg, btnText) {
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(btn.parentElement || msg);
    authRedirectBlocked = true;
    setBusy(btn, true, 'Contacting Google...');
    showMsg(msg, '');
    try {
      var provider = new firebase.auth.GoogleAuthProvider();
      var cred = await auth.signInWithPopup(provider);
      var user = cred.user;
      var name = user.displayName || user.email.split('@')[0];
      var initials = name.split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
      var phone = user.phoneNumber || '';
      await ensureUserDoc(user, {
        displayName: name,
        email: user.email || '',
        phone: phone,
        initials: initials,
        role: 'patient',
        createdAt: new Date().toISOString(),
        gender: '',
        dob: '',
        bloodGroup: '',
        address: '',
        emergencyContact: '',
        allergies: ''
      });
      showMsg(msg, 'Signed in! Redirecting...', 'success');
      setTimeout(redirectAfterAuth, 600);
    } catch (err) {
      showMsg(msg, mv.getErrorMessage(err));
    } finally {
      setBusy(btn, false, btnText);
    }
  }

  $('google-btn').addEventListener('click', function () { handleGoogle($('google-btn'), loginMsg, 'Continue with Google'); });
  $('google-btn-su').addEventListener('click', function () { handleGoogle($('google-btn-su'), signupMsg, 'Continue with Google'); });

  /* ---------- forgot password ---------- */
  $('forgot-link').addEventListener('click', async function () {
    var email = $('login-email').value.trim();
    if (mv.isConfigReady() && !email) { markInvalid($('login-email')); return showMsg(loginMsg, 'Enter your email first, then click Forgot password.'); }
    if (!mv.isConfigReady()) return mv.warnIfNotConfigured(loginForm);
    this.disabled = true;
    var original = this.textContent;
    this.textContent = 'Sending...';
    try {
      await auth.sendPasswordResetEmail(email);
      showMsg(loginMsg, 'Password reset link sent to your email.', 'success');
    } catch (err) {
      showMsg(loginMsg, mv.getErrorMessage(err));
    }
    this.disabled = false;
    this.textContent = original;
  });

  /* ---------- tab switching ---------- */
  loginTab.addEventListener('click', function () { switchTab('login'); });
  signupTab.addEventListener('click', function () { switchTab('signup'); });
  document.querySelectorAll('.switch-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-target')); });
  });

  /* input valid state cleanup */
  document.querySelectorAll('.form-control').forEach(function (input) {
    input.addEventListener('input', function () { markValid(input); });
  });

  /* ---------- if already logged in, go straight to dashboard ---------- */
  if (auth && !mv.configMissing) {
    auth.onAuthStateChanged(function (user) {
      if (user && !authRedirectBlocked) {
        redirectAfterAuth();
      }
    });
  }

  /* setup warning banner */
  mv.warnIfNotConfigured(document.body);
})();