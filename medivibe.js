document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initScrollHeader();
  initScrollAnimation();
  initCounters();
  initTabs();
  initAppointmentForm();
  initQuoteForm();
  initServiceMenu();
  initBrochures();
  initDoctorsDetails();
});

function initDoctorsDetails() {
  var grid = document.getElementById('doctors-grid');
  if (!grid) return;
  window.addEventListener('hashchange', applyDoctorsDetails);
  applyDoctorsDetails();
}

function applyDoctorsDetails() {
  var grid = document.getElementById('doctors-grid');
  if (!grid) return;
  var inDetails = window.location.hash === '#details';
  grid.classList.toggle('details-mode', inDetails);
  if (inDetails) {
    setTimeout(function () {
      grid.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}

function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', function () {
    this.classList.toggle('active');
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('.nav-dropdown-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var parent = this.parentElement;
      var wasOpen = parent.classList.contains('open');
      nav.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      if (!wasOpen) {
        parent.classList.add('open');
      }
    });
  });

  document.querySelectorAll('.nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (this.classList.contains('nav-dropdown-toggle')) return;
      hamburger.classList.remove('active');
      nav.classList.remove('open');
    });
  });
}

function initScrollHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initScrollAnimation() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

function initCounters() {
  var counters = document.querySelectorAll('.counter-number');
  if (!counters.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var counter = entry.target;
        var target = parseInt(counter.getAttribute('data-target'));
        if (isNaN(target)) return;

        var suffix = counter.getAttribute('data-suffix') || '';
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function animate(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          var current = Math.floor(progress * target);
          counter.innerHTML = current + suffix;
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            counter.innerHTML = target + suffix;
          }
        }

        requestAnimationFrame(animate);
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) {
    observer.observe(el);
  });
}

function initTabs() {
  var tabItems = document.querySelectorAll('.tab-item');
  var panels = document.querySelectorAll('.departments-panel');
  if (!tabItems.length || !panels.length) return;

  tabItems.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = this.getAttribute('data-tab');
      if (!target) return;

      tabItems.forEach(function (t) { t.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });

      this.classList.add('active');
      var activePanel = document.getElementById(target);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

function initAppointmentForm() {
  var form = document.querySelector('.appointment-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('.btn');

    if (window.MediVibe && typeof window.MediVibe.bookAppointment === 'function') {
      var data = {
        name: form.querySelector('[name="name"]') ? form.querySelector('[name="name"]').value : '',
        email: form.querySelector('[name="email"]') ? form.querySelector('[name="email"]').value : '',
        phone: form.querySelector('[name="phone"]') ? form.querySelector('[name="phone"]').value : '',
        department: form.querySelector('[name="department"]') ? form.querySelector('[name="department"]').value : '',
        date: form.querySelector('[name="date"]') ? form.querySelector('[name="date"]').value : '',
        time: form.querySelector('[name="time"]') ? form.querySelector('[name="time"]').value : '',
        notes: form.querySelector('[name="notes"]') ? form.querySelector('[name="notes"]').value : ''
      };
      window.MediVibe.bookAppointment(data, btn);
      return;
    }

    var original = btn.textContent;
    btn.textContent = 'Booking...';
    btn.disabled = true;

    setTimeout(function () {
      btn.textContent = 'Appointment Booked!';
      btn.style.background = '#0dcaf0';
      form.reset();

      setTimeout(function () {
        btn.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1000);
  });
}

function initQuoteForm() {
  var forms = document.querySelectorAll('.quote-form');
  if (!forms.length) return;

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.btn');
      var original = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      setTimeout(function () {
        btn.textContent = 'Quote Sent!';
        btn.style.background = '#0dcaf0';
        form.reset();

        setTimeout(function () {
          btn.textContent = original;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1000);
    });
  });
}

function initServiceMenu() {
  var menuLinks = document.querySelectorAll('.services-menu-list a');
  if (!menuLinks.length) return;

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var service = this.getAttribute('data-service');
      if (!service) return;

      var image = document.querySelector('.detail-image');
      var title = document.querySelector('.main-content h2');
      var desc = document.querySelector('.main-content .description');

      if (!image || !title || !desc) return;

      var services = {
        pathology: {
          title: 'Pathology Testing Service',
          image: '🔬',
          bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          text: 'Our pathology department offers comprehensive diagnostic testing services with state-of-the-art equipment and highly skilled pathologists. We provide accurate and timely results for a wide range of medical conditions. From routine blood work to complex histopathological examinations, our team ensures the highest standards of quality and precision. We utilize advanced automated analyzers and digital pathology systems to deliver reliable results that aid in accurate diagnosis and effective treatment planning.'
        },
        microbiology: {
          title: 'Microbiology Tests',
          image: '🦠',
          bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          text: 'Our microbiology laboratory specializes in the identification and characterization of microorganisms that cause infectious diseases. We offer a comprehensive range of tests including bacterial cultures, antibiotic sensitivity testing, fungal studies, and virology assays. Our team of expert microbiologists uses cutting-edge techniques such as PCR, mass spectrometry, and automated culture systems to provide rapid and accurate results, helping clinicians make informed treatment decisions.'
        },
        biochemistry: {
          title: 'Biochemistry Laboratory',
          image: '🧪',
          bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          text: 'The biochemistry department provides a wide array of clinical chemistry tests essential for diagnosing and monitoring various diseases. Our services include metabolic panels, lipid profiles, hormone assays, tumor markers, and therapeutic drug monitoring. Equipped with fully automated analyzers and advanced quality control systems, we ensure precise and reliable results. Our team of skilled biochemists and technicians work diligently to support patient care with accurate laboratory data.'
        },
        hematology: {
          title: 'Hematology Services',
          image: '🩸',
          bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          text: 'Our hematology department offers complete blood count analysis, coagulation studies, and specialized testing for blood disorders. We provide comprehensive diagnostic services for anemia, leukemia, clotting disorders, and other hematological conditions. Using automated hematology analyzers and flow cytometry, our laboratory delivers accurate results with quick turnaround times. Our hematopathologists work closely with clinicians to ensure optimal patient management.'
        },
        immunology: {
          title: 'Immunology & Serology',
          image: '🛡️',
          bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          text: 'The immunology and serology department specializes in testing for autoimmune diseases, allergies, and infectious diseases through antibody and antigen detection. Our services include ELISA, immunofixation, autoimmune panels, and allergy testing. We utilize advanced immunoassay platforms to provide sensitive and specific results. Our team of immunologists ensures accurate interpretation of complex immunological profiles to aid in diagnosis and treatment monitoring.'
        },
        radiology: {
          title: 'Radiology & Imaging',
          image: '📷',
          bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
          text: 'Our radiology department offers a full spectrum of diagnostic imaging services including X-ray, ultrasound, CT scan, MRI, and mammography. Staffed by board-certified radiologists and experienced technologists, we provide high-quality imaging with the latest technology. Our commitment to patient safety includes low-dose protocols and rigorous quality assurance programs. We ensure timely reporting and seamless integration with your healthcare providers for comprehensive patient care.'
        }
      };

      var data = services[service];
      if (!data) return;

      image.style.background = data.bg;
      image.textContent = data.image;
      title.textContent = data.title;
      desc.textContent = data.text;

      window.scrollTo({ top: document.querySelector('.service-detail-section').offsetTop - 80, behavior: 'smooth' });
    });
  });
}

function initBrochures() {
  var brochureLinks = document.querySelectorAll('.brochure-list a');
  if (!brochureLinks.length) return;

  brochureLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var fileName = this.getAttribute('data-file') || 'brochure';
      var content = 'Hospital Service Brochure\n\n';
      content += '================================\n';
      content += 'Department: ' + (this.querySelector('span:last-child') ? this.querySelector('span:last-child').textContent : 'Service') + '\n';
      content += '================================\n\n';
      content += 'Thank you for your interest in our hospital services.\n';
      content += 'For detailed information, please contact our help desk.\n';
      content += 'Phone: +1 (555) 123-4567\n';
      content += 'Email: info@medivibehospital.com\n\n';
      content += 'This document contains general information about our services.\n';
      content += 'For specific medical advice, please consult with our specialists.\n';

      var blob = new Blob([content], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

/* ===== Mahnoor Chrome (merged from mahnoor-chrome.js) ===== */

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