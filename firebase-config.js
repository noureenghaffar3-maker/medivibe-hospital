/* =========================================================
   MediVibe Hospital - Firebase Setup
   ---------------------------------------------------------
   1) Go to https://console.firebase.google.com  -> Add project
   2) Add a Web App  -> copy the config object below
   3) Enable Authentication -> Sign-in method:
        - Email/Password  (ON)
        - Google          (ON)  [optional]
   4) Create Firestore Database (Production mode)
   5) Paste production rules from firestore.rules
   ========================================================= */

var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

window.mvFirebase = (function () {
  function checkMissing() {
    var keys = Object.keys(firebaseConfig);
    for (var i = 0; i < keys.length; i++) {
      var v = firebaseConfig[keys[i]];
      if (!v || String(v).toUpperCase().indexOf('YOUR_') !== -1) {
        return true;
      }
    }
    return false;
  }

  var missing = checkMissing();
  var app = null;
  var auth = null;
  var db = null;

  if (!missing) {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth(app);
    db = firebase.firestore(app);
  }

  function warnIfNotConfigured(root) {
    if (!missing) return false;
    if (!root) root = document.body;
    var warn = document.createElement('div');
    warn.className = 'fb-setup-warning';
    warn.innerHTML =
      '<strong>Firebase configured nahi hai yet.</strong> ' +
      '<a href="README.md" target="_blank">README.md</a> me steps follow karke ' +
      '<code>firebase-config.js</code> me apna config paste karo, phir page refresh karo.';
    root.insertBefore(warn, root.firstChild);
    return true;
  }

  function getErrorMessage(err) {
    if (!err || !err.code) return 'Something went wrong. Please try again.';
    var map = {
      'auth/email-already-in-use': 'This email is already registered. Please login instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Console.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email. Please sign in with password.',
      'auth/requires-recent-login': 'Please logout and login again before changing your password.',
      'auth/invalid-credential': 'Invalid email or password.'
    };
    return map[err.code] || err.message || 'Something went wrong. Please try again.';
  }

  return {
    configMissing: missing,
    app: app,
    auth: auth,
    db: db,
    isConfigReady: function () {
      return !missing && !!db;
    },
    warnIfNotConfigured: warnIfNotConfigured,
    getErrorMessage: getErrorMessage
  };
})();