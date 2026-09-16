/* =========================================================
   MediVibe Patient Dashboard - Data Layer
   Demo arrays + optional Firebase hook (real appointments)
   ========================================================= */
window.PD = (function () {
  var mv = window.mvFirebase;
  var db = mv ? mv.db : null;

  /* ---------- demo doctors (reuse MV.DOCTORS when present) ---------- */
  function normalizeImage(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.indexOf('../') === 0 || path.indexOf('data:') === 0) return path;
    if (path.indexOf('images/') === 0) return '../' + path;
    return path;
  }

  var DOCTORS = ((window.MV && window.MV.DOCTORS) || [
    { id: 'd3', name: 'Dr. Michael Chen', designation: 'Head of Cardiology', department: 'Cardiology', experience: '12+ yrs', qualifications: 'MBBS, FCPS', days: 'Mon-Fri', timings: '09:00 AM - 02:00 PM', image: '../images/doctor-3.jpg', booking: true },
    { id: 'd4', name: 'Dr. Emily Davis', designation: 'Head of Neurology', department: 'Neurology', experience: '10+ yrs', qualifications: 'MBBS, MD', days: 'Mon-Thu', timings: '11:00 AM - 04:00 PM', image: '../images/doctor-4.jpg', booking: true },
    { id: 'd5', name: 'Dr. James Wilson', designation: 'Senior Physician', department: 'General Medicine', experience: '15+ yrs', qualifications: 'MBBS, MRCP', days: 'Mon-Sat', timings: '08:00 AM - 12:00 PM', image: '../images/doctor-5.jpg', booking: true },
    { id: 'd8', name: 'Dr. Sarah Johnson', designation: 'Medical Superintendent', department: 'Pediatrics', experience: '11+ yrs', qualifications: 'MBBS, DCH', days: 'Wed-Sun', timings: '10:00 AM - 01:00 PM', image: '../images/doctor-8.jpg', booking: false }
  ]).map(function (d) {
    return Object.assign({}, d, { image: normalizeImage(d.image) });
  });

  var BOOKABLE_DEPARTMENTS = (window.MV && window.MV.BOOKABLE_DEPARTMENTS) || ['Cardiology', 'Neurology', 'General Medicine', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Ophthalmology', 'Gynecology'];
  var TIME_SLOTS = (window.MV && window.MV.TIME_SLOTS) || ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '05:00 PM'];

  /* ---------- demo data ---------- */
  var demos = {
    appointments: [
      { id: 'PD-1001', doctorName: 'Dr. Michael Chen', specialty: 'Cardiology', avatar: 'MC', date: '2026-09-22', time: '10:00 AM', type: 'In-Person', status: 'scheduled', fees: 2500, reason: 'Chest discomfort and BP review' },
      { id: 'PD-1002', doctorName: 'Dr. Emily Davis', specialty: 'Neurology', avatar: 'ED', date: '2026-09-25', time: '02:00 PM', type: 'Online', status: 'scheduled', fees: 3000, reason: 'Follow-up on migraine treatment' },
      { id: 'PD-1003', doctorName: 'Dr. James Wilson', specialty: 'General Medicine', avatar: 'JW', date: '2026-09-12', time: '09:00 AM', type: 'In-Person', status: 'completed', fees: 1800, reason: 'Annual health checkup' },
      { id: 'PD-1004', doctorName: 'Dr. Sarah Johnson', specialty: 'Pediatrics', avatar: 'SJ', date: '2026-09-08', time: '11:00 AM', type: 'Online', status: 'completed', fees: 2200, reason: 'Child vaccination consultation' },
      { id: 'PD-1005', doctorName: 'Dr. Michael Chen', specialty: 'Cardiology', avatar: 'MC', date: '2026-08-30', time: '03:00 PM', type: 'In-Person', status: 'cancelled', fees: 2500, reason: 'ECG report discussion' }
    ],
    prescriptions: [
      { id: '#PRE0025', doctor: 'Dr. Michael Chen', specialty: 'Cardiology', department: 'Cardiology OP', date: '2026-08-12', time: '09:00 AM', status: 'Active',
        items: [
          { name: 'Atorvastatin 20mg', dosage: '1-0-0', duration: '30 days', note: 'After dinner' },
          { name: 'Losartan 50mg', dosage: '1-0-0', duration: '30 days', note: 'Morning with food' },
          { name: 'Aspirin 75mg', dosage: '0-1-0', duration: '30 days', note: 'After lunch' }
        ],
        advice: 'Low salt diet, daily 30 min walk, monitor BP twice a day.' },
      { id: '#PRE0024', doctor: 'Dr. Emily Davis', specialty: 'Neurology', department: 'Neurology OP', date: '2026-08-03', time: '11:00 AM', status: 'Completed',
        items: [
          { name: 'Sumatriptan 50mg', dosage: '0-0-1', duration: '10 days', note: 'At onset of migraine' },
          { name: 'Vitamin B-Complex', dosage: '1-1-0', duration: '21 days', note: 'After meals' }
        ],
        advice: 'Avoid triggers, maintain sleep schedule, keep headache diary.' },
      { id: '#PRE0023', doctor: 'Dr. James Wilson', specialty: 'General Medicine', department: 'General OP', date: '2026-07-25', time: '10:00 AM', status: 'Active',
        items: [
          { name: 'Panadol 500mg', dosage: '1-0-1', duration: '5 days', note: 'If fever > 100F' },
          { name: 'Cefuroxime 250mg', dosage: '1-0-0', duration: '7 days', note: 'After breakfast' }
        ],
        advice: 'Complete the antibiotic course, drink plenty of fluids.' },
      { id: '#PRE0022', doctor: 'Dr. Sarah Johnson', specialty: 'Pediatrics', department: 'Pediatrics OP', date: '2026-07-15', time: '12:00 PM', status: 'Completed',
        items: [
          { name: 'ORS Sachets', dosage: '1-0-0', duration: '3 days', note: 'Rehydrate after loose stools' },
          { name: 'Zinc Sulfate 20mg', dosage: '1-0-0', duration: '14 days', note: 'Once daily' }
        ],
        advice: 'Bland diet, plenty of fluids, follow-up in 1 week.' }
    ],
    invoices: [
      { id: '#INV-1124', description: 'Cardiology Consultation', created: '2026-08-12', due: '2026-08-19', amount: 2500, status: 'paid' },
      { id: '#INV-1123', description: 'Neurology Online Consult', created: '2026-08-03', due: '2026-08-10', amount: 3000, status: 'partially-paid' },
      { id: '#INV-1122', description: 'General Medicine + Lab Panel', created: '2026-07-25', due: '2026-08-02', amount: 4800, status: 'unpaid' },
      { id: '#INV-1121', description: 'Pediatric Vaccination', created: '2026-07-15', due: '2026-07-22', amount: 2200, status: 'paid' },
      { id: '#INV-1120', description: 'Cardiology Follow-up', created: '2026-07-02', due: '2026-07-09', amount: 2500, status: 'paid' }
    ],
    vitals: [
      { id: 1, date: '2026-09-14', time: '08:15 AM', hr: 72, bp: '118/76', spo2: 98, weight: 62.4, status: 'Normal' },
      { id: 2, date: '2026-09-10', time: '09:30 AM', hr: 78, bp: '124/82', spo2: 97, weight: 62.8, status: 'Normal' },
      { id: 3, date: '2026-09-05', time: '07:45 AM', hr: 84, bp: '132/86', spo2: 96, weight: 63.1, status: 'Slightly High' },
      { id: 4, date: '2026-08-28', time: '08:00 AM', hr: 76, bp: '120/78', spo2: 98, weight: 63.0, status: 'Normal' },
      { id: 5, date: '2026-08-21', time: '06:50 AM', hr: 88, bp: '128/84', spo2: 95, weight: 63.5, status: 'Slightly High' }
    ],
    healthReports: [
      { id: 'RP-501', name: 'Lipid Profile', type: 'Lab Report', doctor: 'Dr. Michael Chen', date: '2026-08-12', status: 'Ready', doctorInitials: 'MC' },
      { id: 'RP-502', name: 'Chest X-Ray', type: 'Imaging', doctor: 'Dr. James Wilson', date: '2026-08-05', status: 'Ready', doctorInitials: 'JW' },
      { id: 'RP-503', name: 'Thyroid Test (T3/T4/TSH)', type: 'Lab Report', doctor: 'Dr. Emily Davis', date: '2026-07-30', status: 'Ready', doctorInitials: 'ED' },
      { id: 'RP-504', name: 'Complete Blood Count', type: 'Lab Report', doctor: 'Dr. James Wilson', date: '2026-07-25', status: 'Pending', doctorInitials: 'JW' }
    ],
    activity: [
      { icon: 'fa-heart-pulse', color: 'green', text: 'Blood pressure logged — 118/76 mmHg', time: 'Today, 08:15 AM' },
      { icon: 'fa-flask', color: 'blue', text: 'Lipid Profile lab report uploaded', time: 'Yesterday' },
      { icon: 'fa-calendar-check', color: 'green', text: 'Appointment completed with Dr. James Wilson', time: 'Sep 12' },
      { icon: 'fa-file-prescription', color: 'orange', text: 'Prescription #PRE0024 issued by Dr. Emily Davis', time: 'Aug 3' },
      { icon: 'fa-notes-medical', color: 'blue', text: 'Appointment confirmed with Dr. Michael Chen', time: 'Aug 1' }
    ],
    suggestions: [
      { type: 'high', icon: 'fa-triangle-exclamation', iconColor: 'red', title: 'Blood Pressure Trend Up', text: 'Your BP readings have risen over the last week. We recommend booking a follow-up with Dr. Michael Chen.', time: 'Today', action: 'Book Follow-up', actionType: 'followup' },
      { type: 'refill', icon: 'fa-pills', iconColor: 'blue', title: 'Medication Refill Reminder', text: 'Atorvastatin 20mg has 3 days of supply left. Request a refill from the pharmacy or your doctor.', time: 'Tomorrow', action: 'Request Refill', actionType: 'refill' },
      { type: 'lifestyle', icon: 'fa-person-walking', iconColor: 'green', title: 'Daily Activity & Hydration', text: 'Your step count was below target this week. Try two 15-minute walks and 8 glasses of water daily.', time: 'This week', action: 'View Tips', actionType: 'tips' },
      { type: 'lab', icon: 'fa-flask-vial', iconColor: 'orange', title: 'New Lab Result Available', text: 'Your Complete Blood Count report is ready. View the latest analysis from your Health Reports.', time: 'Recently', action: 'View Report', actionType: 'report' }
    ]
  };

  /* ---------- Firestore real appointments (working Firestore me) ---------- */
  var realAppointments = [];
  function isFirebaseReady() {
    return !!mv && !!db && !mv.configMissing;
  }

  function fetchRealAppointments(userId) {
    return new Promise(function (resolve) {
      if (!isFirebaseReady() || !userId) return resolve(null);
      db.collection('appointments').where('userId', '==', userId).get()
        .then(function (snap) {
          var out = [];
          snap.forEach(function (d) {
            var a = d.data();
            out.push({
              id: d.id,
              doctorName: a.doctorName || 'Doctor',
              specialty: a.department || '',
              avatar: initialsOf(a.doctorName || 'Dr'),
              date: a.date || '',
              time: a.time || '',
              type: a.mode === 'Online' ? 'Online' : 'In-Person',
              status: statusFrom(a.status),
              fees: a.fees || 0,
              reason: a.notes || ''
            });
          });
          realAppointments = out;
          resolve(out);
        })
        .catch(function () { resolve(null); });
    });
  }

  function initialsOf(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }

  function statusFrom(s) {
    s = (s || 'pending').toLowerCase();
    if (s === 'completed' || s === 'checked out') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    if (s === 'confirmed') return 'scheduled';
    return 'scheduled';
  }

  function getAppointments() {
    return realAppointments.length ? realAppointments : demos.appointments;
  }

  function getDoctors() { return DOCTORS; }
  function getBookableDepartments() { return BOOKABLE_DEPARTMENTS; }
  function getTimeSlots() { return TIME_SLOTS; }
  function getPrescriptions() { return demos.prescriptions; }
  function getInvoices() { return demos.invoices; }
  function getVitals() { return demos.vitals; }
  function getReports() { return demos.healthReports; }
  function getActivity() { return demos.activity; }
  function getSuggestions() { return demos.suggestions; }

  return {
    demos: demos,
    DOCTORS: DOCTORS,
    BOOKABLE_DEPARTMENTS: BOOKABLE_DEPARTMENTS,
    TIME_SLOTS: TIME_SLOTS,
    isFirebaseReady: isFirebaseReady,
    fetchRealAppointments: fetchRealAppointments,
    getAppointments: getAppointments,
    getDoctors: getDoctors,
    getBookableDepartments: getBookableDepartments,
    getTimeSlots: getTimeSlots,
    getPrescriptions: getPrescriptions,
    getInvoices: getInvoices,
    getVitals: getVitals,
    getReports: getReports,
    getActivity: getActivity,
    getSuggestions: getSuggestions
  };
})();