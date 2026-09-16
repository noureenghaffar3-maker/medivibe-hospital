/* =========================================================
   MediVibe Patient Dashboard - Vitals dashboard logic
   ========================================================= */
(function () {
  var PD = window.PD || {};

  function $(id) { return document.getElementById(id); }

  var trendChart = null;
  var donutChart = null;
  var vitals = [];
  var donutMode = 'hr';

  var colors = { primary: '#135dd8', cyan: '#00b4d8', green: '#16a34a', orange: '#d97706', red: '#ef4444' };

  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(String(iso) + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  /* ---------- KPI cards ---------- */
  function renderKpis() {
    if (!vitals.length) return;
    var latest = vitals[0];
    $('v-hr').textContent = latest.hr + ' bpm';
    $('v-bp').textContent = latest.bp;
    $('v-spo2').textContent = latest.spo2 + '%';
    $('v-weight').textContent = latest.weight + ' kg';

    var hrBadge = $('v-hr-badge'), bpBadge = $('v-bp-badge'), spo2Badge = $('v-spo2-badge');
    if (latest.hr > 84) { hrBadge.textContent = 'Elevated'; hrBadge.className = 'vitals-badge high'; }
    else { hrBadge.textContent = 'Normal'; hrBadge.className = 'vitals-badge normal'; }

    var sys = parseInt((latest.bp || '0').split('/')[0], 10);
    if (sys >= 130) { bpBadge.textContent = 'Slightly High'; bpBadge.className = 'vitals-badge high'; }
    else { bpBadge.textContent = 'Normal'; bpBadge.className = 'vitals-badge normal'; }

    if (latest.spo2 < 96) { spo2Badge.textContent = 'Below Normal'; spo2Badge.className = 'vitals-badge high'; }
    else { spo2Badge.textContent = 'Normal'; spo2Badge.className = 'vitals-badge normal'; }
  }

  /* ---------- table ---------- */
  function renderTable() {
    var body = $('vitalsTableBody');
    if (!vitals.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No vitals logged yet.</p></div></td></tr>';
      return;
    }
    body.innerHTML = vitals.map(function (v) {
      return '<tr>' +
        '<td><div style="font-weight:600;">' + fmtDate(v.date) + '</div><div class="doc-sub">' + v.time + '</div></td>' +
        '<td>' + v.hr + ' bpm</td>' +
        '<td>' + v.bp + '</td>' +
        '<td>' + v.spo2 + '%</td>' +
        '<td>' + v.weight + ' kg</td>' +
        '<td><span class="status-pill ' + (String(v.status).toLowerCase().indexOf('high') !== -1 ? 'slightly-high' : 'normal') + '">' + v.status + '</span></td>' +
        '</tr>';
    }).join('');
  }

  /* ---------- charts ---------- */
  function renderCharts() {
    var filtered = vitals.slice().reverse(); // oldest -> latest
    var from = $('chartFrom').value;
    if (from) filtered = filtered.filter(function (v) { return String(v.date) >= from; });

    var labels = filtered.map(function (v) { return fmtDate(v.date); });
    var hrData = filtered.map(function (v) { return v.hr; });
    var bpSys = filtered.map(function (v) { return parseInt((v.bp || '0').split('/')[0], 10) || 0; });
    var bpDia = filtered.map(function (v) { return parseInt((v.bp || '0').split('/')[1], 10) || 0; });

    if (trendChart) trendChart.destroy();
    trendChart = new Chart($('trendChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Heart Rate (bpm)', data: hrData, borderColor: colors.primary, backgroundColor: 'rgba(19,93,216,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2.5 },
          { label: 'BP Systolic', data: bpSys, borderColor: colors.red, backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2, borderDash: [5, 4] },
          { label: 'BP Diastolic', data: bpDia, borderColor: colors.orange, backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2, borderDash: [5, 4] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12, fontSize: 12, font: { family: 'Roboto' } } } },
        scales: { y: { beginAtZero: false, grid: { color: '#eef1f6' } }, x: { grid: { display: false } } }
      }
    });

    // weekly average donut (HR ranges this week)
    var week = vitals.slice(0, 7);
    var norm = week.filter(function (v) { return v.hr <= 84; }).length;
    var high = week.length - norm;
    if (donutChart) donutChart.destroy();
    donutChart = new Chart($('donutChart'), {
      type: 'doughnut',
      data: {
        labels: ['Normal (<85 bpm)', 'Elevated'],
        datasets: [{ data: [norm, high], backgroundColor: [colors.green, colors.red], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, fontSize: 11, font: { family: 'Roboto' } } },
          title: { display: true, text: 'Heart Rate Distribution — Recent', font: { size: 13, family: 'Roboto' }, padding: { bottom: 8 } }
        }
      }
    });
  }

  /* ---------- quick log ---------- */
  $('vSaveBtn').addEventListener('click', function () {
    var hr = parseInt($('vFormHr').value, 10);
    var bp = $('vFormBp').value.trim();
    var spo2 = parseInt($('vFormSpo2').value, 10);
    var weight = parseFloat($('vFormWeight').value);
    $('vError').textContent = ''; $('vError').classList.remove('show');
    $('vSuccess').textContent = ''; $('vSuccess').classList.remove('show');

    if (!hr || hr < 40 || hr > 220) { $('vError').textContent = 'Enter a valid heart rate (40–220).'; $('vError').classList.add('show'); return; }
    if (!bp || !/^\d{2,3}\/\d{2,3}$/.test(bp)) { $('vError').textContent = 'Enter BP like 120/80.'; $('vError').classList.add('show'); return; }
    if (!spo2 || spo2 < 60 || spo2 > 100) { $('vError').textContent = 'Enter a valid SpO2 (60–100).'; $('vError').classList.add('show'); return; }
    if (!weight || weight <= 0) { $('vError').textContent = 'Enter a valid weight.'; $('vError').classList.add('show'); return; }

    var now = new Date();
    var iso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    var status = (hr > 84 || parseInt(bp.split('/')[0], 10) >= 130) ? 'Slightly High' : 'Normal';

    vitals.unshift({ id: Date.now(), date: iso, time: time, hr: hr, bp: bp, spo2: spo2, weight: weight, status: status });

    $('vFormHr').value = ''; $('vFormBp').value = ''; $('vFormSpo2').value = ''; $('vFormWeight').value = '';
    $('vSuccess').textContent = 'Reading saved successfully.'; $('vSuccess').classList.add('show');

    renderKpis(); renderTable(); renderCharts();
    setTimeout(function () {
      bootstrap.Modal.getInstance($('vitalsModal')).hide();
      $('vSuccess').textContent = ''; $('vSuccess').classList.remove('show');
      if (window.pdToast) window.pdToast('New vitals logged!', 'success');
    }, 1100);
  });

  $('addVitalQuickBtn').addEventListener('click', function () {
    bootstrap.Modal.getOrCreateInstance($('vitalsModal')).show();
  });

  $('chartFrom').addEventListener('change', renderCharts);

  /* ---------- boot ---------- */
  function boot() {
    vitals = PD.getVitals ? PD.getVitals() : [];
    if (typeof Chart === 'undefined') {
      var box = document.querySelector('.chart-box');
      if (box) box.innerHTML = '<div class="empty-state"><p>Chart.js load nahi hua — internet check karo.</p></div>';
    }
    renderKpis(); renderTable(); renderCharts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();