/* =========================================================
   MediVibe Patient Dashboard - Shared Chrome
   Sidebar, header profile, auth hook, toasts
   ========================================================= */
(function () {
  var mv = window.mvFirebase;
  var auth = mv ? mv.auth : null;
  var db = mv ? mv.db : null;

  var DEMO_USER = {
    name: 'Ayesha Khan',
    email: 'ayesha.khan@gmail.com',
    role: 'Patient',
    initials: 'AK'
  };

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }

  function initialsOf(name) {
    return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  function paintAvatar(scope, name, photo) {
    var els = document.querySelectorAll('[data-pd-avatar="' + scope + '"]');
    els.forEach(function (el) {
      el.innerHTML = photo
        ? '<img src="' + photo + '" alt="' + name + '">'
        : initialsOf(name);
    });
  }

  function paintProfile(name, email) {
    var nameEls = document.querySelectorAll('[data-pd-name]');
    var emailEls = document.querySelectorAll('[data-pd-email]');
    nameEls.forEach(function (el) { el.textContent = name; });
    emailEls.forEach(function (el) { el.textContent = email; });
  }

  function toast(message, type) {
    var t = document.createElement('div');
    t.className = 'toast-med ' + (type || 'success');
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 400);
    }, 3200);
  }
  window.pdToast = toast;

  /* ---------- sidebar collapse (mobile + desktop) ---------- */
  var sidebar = document.querySelector('.sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');

  function setCollapsed(collapsed, persist) {
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed', collapsed);
    if (persist !== false) {
      try { localStorage.setItem('pd_sidebar_collapsed', collapsed ? '1' : '0'); } catch (e) {}
    }
  }

  function applySavedState() {
    if (!sidebar) return;
    var saved = null;
    try { saved = localStorage.getItem('pd_sidebar_collapsed'); } catch (e) {}
    if (window.innerWidth <= 992) {
      setCollapsed(true, false);
      if (backdrop) backdrop.classList.remove('show');
    } else {
      setCollapsed(saved === '1', false);
    }
  }

  var collapseBtn = document.getElementById('sidebarCollapseBtn');
  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener('click', function () {
      if (window.innerWidth <= 992) {
        sidebar.classList.toggle('collapsed');
        if (backdrop) backdrop.classList.toggle('show', !sidebar.classList.contains('collapsed'));
      } else {
        var isCollapsed = sidebar.classList.contains('collapsed');
        setCollapsed(!isCollapsed, true);
      }
    });
  }

  var toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      var isCollapsed = sidebar.classList.contains('collapsed');
      sidebar.classList.toggle('collapsed', !isCollapsed);
      if (backdrop) backdrop.classList.toggle('show', !isCollapsed);
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', function () {
      if (sidebar) sidebar.classList.add('collapsed');
      backdrop.classList.remove('show');
    });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 992 && backdrop) backdrop.classList.remove('show');
  });

  /* ---------- nav active state ---------- */
  var currentPage = (window.location.pathname.split('/').pop() || 'patient-dashboard.html').split('?')[0];

  document.querySelectorAll('.nav-link[data-page], .sub-menu a[data-page]').forEach(function (link) {
    if (link.getAttribute('data-page') === currentPage) {
      // mark parent dropdown open + link active
      link.classList.add('active');
      var parent = link.closest('.nav-item.dropdown');
      if (parent) parent.classList.add('show-dropdown');
      // exact top-level nav link
      var top = link.closest('.nav-list [data-page]');
    }
  });

  // Also mark top-level .nav-link whose data-page matches
  document.querySelectorAll('.nav-link[data-page]').forEach(function (link) {
    if (link.getAttribute('data-page') === currentPage) link.classList.add('active');
  });

  /* ---------- auth + profile ---------- */
  function applyUser(user, profile) {
    var name = (profile && profile.displayName) || (user && user.displayName) || (user && user.email && user.email.split('@')[0]) || DEMO_USER.name;
    var email = (user && user.email) || DEMO_USER.email;
    var photo = user && user.photoURL;
    paintProfile(name.charAt(0).toUpperCase() + name.slice(1), email);
    paintAvatar('side', name, photo);
    paintAvatar('head', name, photo);
    if (db && user) {
      db.collection('users').doc(user.uid).get().then(function (snap) {
        if (snap.exists) {
          var d = snap.data();
          var n = d.displayName || name;
          paintProfile(n, user.email);
          paintAvatar('side', n, photo);
          paintAvatar('head', n, photo);
        }
      }).catch(function () {});
    }
    window.pdUser = {
      name: name,
      email: email,
      userId: user ? user.uid : null,
      profile: profile,
      isDemo: !user
    };
    var evt = document.createEvent('Event');
    evt.initEvent('pd-user-ready', true, true);
    document.dispatchEvent(evt);
  }

  function boot() {
    applyUser(null, null); // demo first so UI is never empty
    if (mv && mv.configMissing) {
      applyUser(null, null);
      return;
    }
    if (auth) {
      auth.onAuthStateChanged(function (user) {
        if (!user) {
          applyUser(null, null);
          return;
        }
        applyUser(user, null);
      });
    }
  }

  /* ---------- logout ---------- */
  function doLogout() {
    if (auth && window.mvFirebase && !window.mvFirebase.configMissing) {
      auth.signOut().then(function () {
        window.location.href = '../auth.html?returnTo=' + encodeURIComponent('patient-dashboard/patient-dashboard.html');
      });
    } else {
      window.location.href = '../index.html';
    }
  }

  document.querySelectorAll('[data-pd-logout]').forEach(function (btn) {
    btn.addEventListener('click', doLogout);
  });

  /* ---------- notifications demo ---------- */
  var notifData = [
    { icon: 'fa-calendar-check', text: 'Appointment confirmed with Dr. Sarah Johnson', time: '2 hrs ago', unread: true },
    { icon: 'fa-flask', text: 'Your lab report is ready to view', time: 'Yesterday', unread: true },
    { icon: 'fa-file-invoice-dollar', text: 'Invoice #INV-1124 payment received', time: '2 days ago', unread: false },
    { icon: 'fa-heart-pulse', text: 'New blood pressure reading logged', time: '3 days ago', unread: false }
  ];

  var notifContainer = document.getElementById('notifContainer');
  if (notifContainer) {
    notifContainer.innerHTML = notifData.map(function (n) {
      return '<div class="notif-item d-flex gap-2 px-3 py-2 border-bottom">' +
        '<i class="fa-solid ' + n.icon + ' mt-1" style="color:#135dd8;"></i>' +
        '<div><div style="font-size:0.82rem;">' + n.text + '</div>' +
        '<small class="text-muted">' + n.time + '</small></div></div>';
    }).join('');
  }

  /* ---------- no-config bar ---------- */
  if (mv && mv.configMissing) {
    var bar = document.createElement('div');
    bar.className = 'no-config-bar';
    bar.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' +
      'Yeh demo data hai. Firebase setup nahi hua — real accounts/work \u2014 ' +
      '&nbsp;<a href="../README.md" target="_blank">README setup steps</a>.';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  applySavedState();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();