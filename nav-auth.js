/* MediVibe - Nav auth state (Login/Dashboard button on header) */
(function () {
  var mv = window.mvFirebase;
  if (!mv) return;

  var btnNav = document.querySelector('.header-cta-buttons .btn-signin') || document.querySelector('.nav .btn-nav');
  if (!btnNav) return;

  if (mv.configMissing) {
    btnNav.setAttribute('href', 'auth.html');
    btnNav.innerHTML =
      'Log In <span class="btn-arrow-circle"><i class="fa-solid fa-chevron-right"></i></span>';
    return;
  }

  mv.auth.onAuthStateChanged(function (user) {
    if (!user) {
      btnNav.innerHTML =
        'Log In <span class="btn-arrow-circle"><i class="fa-solid fa-chevron-right"></i></span>';
      btnNav.setAttribute('href', 'auth.html');
      return;
    }

    var firstName = (user.displayName || user.email || 'User').split(' ')[0];
    var asset = (user.displayName || user.email || 'U')
      .split(' ').filter(Boolean).slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); }).join('');

    var wrap = document.createElement('span');
    wrap.className = 'nav-auth-wrap';

    var chip = document.createElement('a');
    chip.className = 'nav-user-chip';
    chip.href = 'patient-dashboard/patient-dashboard.html';
    chip.innerHTML =
      (user.photoURL
        ? '<img class="chip-avatar" src="' + user.photoURL + '" alt="">'
        : '<span class="chip-avatar">' + asset + '</span>') +
      firstName;

    var logout = document.createElement('button');
    logout.className = 'nav-logout';
    logout.title = 'Logout';
    logout.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
    logout.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      mv.auth.signOut().then(function () {
        window.location.reload();
      });
    });

    wrap.appendChild(chip);
    wrap.appendChild(logout);
    btnNav.replaceWith(wrap);
  });
})();