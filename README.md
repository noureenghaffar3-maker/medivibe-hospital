# MediVibe Hospital System

Medivibe Hospital ki static website + **patient portal** (Login/Signup + Client Dashboard) — Firebase Auth + Firestore ke saath.

## 🔥 Firebase Setup (1 baar karna hai)

1. **Firebase project banao** → https://console.firebase.google.com → "Add project"
2. **Web App add karo** → Project Settings → Add App → Web → wahan jo config object mile usko **`firebase-config.js`** me paste karo (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. **Authentication enable karo** → Build → Authentication → Sign-in method:
   - `Email/Password` → Enable
   - `Google` → Enable (optional)
4. **Firestore Database banao** → Build → Firestore Database → Create database (Production mode) → location choose karo.
5. **Rules paste karo** → Firestore → Rules tab me `firestore.rules` file ka content paste karo → Publish.

> Firebase configured hone se pehle site khologe to ek yellow warning banner dikhega — config paste karte hi sab kaam karega.

## 📁 Files

| File | Kaam |
|------|------|
| `index.html` | Home |
| `auth.html` + `auth-page.js` | Login / Sign Up / Google / Forgot password |
| `patient-dashboard/` | Client Dashboard (Health Tracking + AI Assistant) |
| `doctors-data.js` | Doctors ki list (gallery se) |
| `firebase-config.js` | Firebase init — **config yahan paste karna hai** |
| `nav-auth.js` | Har page ke header me Login/Dashboard button state |
| `appointment.html` + `appointment-book.js` | Appointment booking (Firestore me save hoti hai) |

## 📊 Dashboard Features

- **Overview** — upcoming / pending / completed appointments + stats
- **My Appointments** — appointments list, status badges, cancel
- **Book Appointment** — department → doctor → date/time select karke book
- **Find Doctors** — search + filter, doctor se directly book
- **Medical Records** — prescriptions, lab reports, vaccinations add/delete
- **Profile Settings** — name, phone, gender, DOB, blood group, emergency contact, allergies + password change

## 🚀 Run Karne Ka Tarika

Koi server ki zaroorat nahi — project folder me se kisi bhi `.html` file ko **double-click / directly browser me kholo**, sab kuch chalega (classic scripts + CDN Firebase use hote hain, isliye `file://` par bhi kaam karta hai):

```
index.html        → Home
auth.html         → Login / Sign Up
patient-dashboard/patient-dashboard.html → Client Dashboard
appointment.html  → Book Appointment
```

Deployment ke liye kisi bhi static host pe chalega (Netlify, Vercel, GitHub Pages) — bas folder upload kar do.

## 🔒 Security

Har user sirf **apne** appointments / medical records / profile dekhe aur edit kare — `firestore.rules` isi liye hai. Production ke liye rules file ko console me paste karna zaroori hai.

## 📝 Note

- Doctor list frontend me `doctors-data.js` se aati hai (gallery se). 
- Jab koi doctor/staff admin portal banega, tab appointments ke status change karne ke rules add karne honge (file ke end me example likha hai).