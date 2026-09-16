/* =========================================================
   MediVibe Patient Dashboard - AI Ask Questions (chat UI)
   ========================================================= */
(function () {
  function $(id) { return document.getElementById(id); }

  var introShown = false;

  function botReply(query) {
    var q = (query || '').toLowerCase();
    if (q.indexOf('lab report') !== -1 || q.indexOf('report') !== -1) {
      return "Aap ke latest reports — Lipid Profile aur CBC — donors ke hisaab se normal range ke andar hain. Thyroid report bhi available hai. Kisi test ki detail ke liye 'Health Reports' section check karein, ya apne doctor se interpretation discuss karein.";
    }
    if (q.indexOf('ask my doctor') !== -1) {
      return "Apne doctor se ye sawal zarur poochein:\n1. Kya mujhe apni medicine ki dosage badhani ya kam karni chahiye?\n2. Meri BP is level par, kitne time baad check karni chahiye?\n3. Kya mujhe koi aur test ki zaroorat hai?\n4. Kya daily exercise aur diet meri condition ke liye theek hai?";
    }
    if (q.indexOf('bp') !== -1 || q.indexOf('blood pressure') !== -1) {
      return "Aapki latest BP 118/76 mmHg ke laqreeb hai jo normal hai. Agar achanak 130/90 se ooper jaye to: 1) Nikte waqt aaram karein, 2) Namak kam karein, 3) Panain khoob piyein. Agar maheena bhar lagatar high rahe to follow-up appointment book karein. Ye sirf general guidance hai.";
    }
    if (q.indexOf('heart') !== -1 || q.indexOf('pulse') !== -1) {
      return "Aapki recent heart rate mostly 72-84 bpm between hai jo normal trend hai. Elevation (85+) dhoop, caffeine, ya tension se ho sakti hai. Agar chakkar, saans lene me takleef, ya ghabrahat ke saath ho to foran doctor se raabta karein.";
    }
    if (q.indexOf('medicine') !== -1 || q.indexOf('prescription') !== -1 || q.indexOf('dose') !== -1) {
      return "Aapki active prescription me Atorvastatin 20mg (1-0-0), Losartan 50mg (1-0-0) aur Aspirin 75mg (0-1-0) hai. Doctor ke hukm ke baghair koi medicine band nahi karein, aur kisi bhi naye medicine ke pehle doctor se zaroor poochein.";
    }
    if (q.indexOf('want to meet') !== -1 || q.indexOf('appointment') !== -1 || q.indexOf('book') !== -1) {
      return "Bilkul! Apne 'Appointments' section se kisi bhi department ke doctor ke saath aasani se appointment book kar sakte hain. Agar jaana chahiye kaun si department select karni hai, to mujhe apna symptom batayein.";
    }
    if (q.indexOf('hi') !== -1 || q.indexOf('hello') !== -1 || q.indexOf('salam') !== -1) {
      return "Salam! Main MediVibe AI assistant hoon. Whatsapp se behtar, main aapko 24/7 answers deta hoon. Apni medicine, reports ya symptoms ke baare me sawal poochin.";
    }
    if (q.indexOf('thank') !== -1) {
      return "Aapka khair-muqaddama! Healthy rahein. Aapki har zaroorat ke liye MediVibe hamesha maujood hai. Koi aur sawal ho to zaroor poochein.";
    }
    if (q.indexOf('fever') !== -1 || q.indexOf('bukhar') !== -1) {
      return "Agr fever 100\u00b0F se zyada hai to Paracetamol (Panadol 500mg) 1-0-1 le sakte hain. Khoob aaram aur maydagi (fluids) lein. Age 24 ghante se zyada fever, cheewani, ya sakht sar dard ho to doctor se foran raabta karein.";
    }
    if (q.indexOf('headache') !== -1 || q.indexOf('migraine') !== -1 || q.indexOf('sar dard') !== -1) {
      return "Migraine history ke saath, headache ke waqt Sumatriptan 50mg (0-0-1) le sakti hain. Neend ka system zarur maintain karein aur triggers (like stress, light) se bachein. Agar hafte me 2+ episodes ho to next appointment me zaroor share karein.";
    }
    return "Ye acha sawal hai! Main aapki medicines aur reports ke context se general guidance de raha hoon. Is specific baare me apne consultant doctor se poochna behtar hoga. Saath hi 'Appointments' se follow-up book kar sakti hain — chahen to main guide karoonga.";
  }

  function scrollBottom() {
    var box = $('chatMsgs');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function addMsg(text, who) {
    var box = $('chatMsgs');
    var div = document.createElement('div');
    div.className = 'chat-bubble ' + who;
    div.innerHTML = text.replace(/\n/g, '<br>');
    box.appendChild(div);
    scrollBottom();
  }

  function send(q) {
    q = (q || '').trim();
    if (!q) return;
    addMsg(q, 'user');
    $('chatInput').value = '';
    setTimeout(function () {
      addMsg(botReply(q), 'bot');
      if (window.pdToast) window.pdToast('AI response ready', 'success');
    }, 700);
  }

  function boot() {
    if (!introShown) {
      setTimeout(function () {
        addMsg('Salaam! 👋 I am MediVibe AI Health Assistant. Apni medicines, symptoms, ya reports ke baare me sawal poochin — main help karunga.', 'bot');
        introShown = true;
      }, 400);
    }

    $('chatSendBtn').addEventListener('click', function () { send($('chatInput').value); });
    $('chatInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send($('chatInput').value);
    });
    document.querySelectorAll('.chat-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { send(chip.getAttribute('data-q')); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();