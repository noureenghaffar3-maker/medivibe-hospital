/* MediVibe - Mahnoor Chrome JS (sticky nabvar + back-to-top) */
(function () {
  var nav = document.querySelector('.my-nav');
  if (!nav) return;

  var triggerPoint = 250;
  var navHeight = nav.offsetHeight;
  document.body.style.setProperty('--nav-h', navHeight + 'px');

  function onScroll() {
    if (window.scrollY > triggerPoint) {
      if (!nav.classList.contains('sticky-active')) {
        nav.classList.add('sticky-active');
        document.body.classList.add('has-sticky-header');
      }
    } else {
      nav.classList.remove('sticky-active');
      document.body.classList.remove('has-sticky-header');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.my-nav .navbar-nav .nav-item:not(.dropdown) .nav-link').forEach(function (link) {
    var href = (link.getAttribute('href') || '').split('#')[0];
    if (href === path) {
      link.classList.add('active');
    }
  });
})();