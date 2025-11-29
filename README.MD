# Nahid Exam's World

Frontend-only exam app with admin-controlled time limit.

Important changes
- The exam time limit is now controlled only by Admin. Students cannot change the time.
- Admin must log in (password in script.js) to:
  - Change the default time limit (minutes)
  - View all attempts
  - Clear all attempts
  - Export attempts as CSV

How to run locally
1. Put `index.html`, `styles.css`, `script.js` in the same folder.
2. Open `index.html` in your browser.
3. Admin: Go to Admin section and enter admin password to set default exam time (minutes). Admin password is by default `admin123` (change in `script.js`).
4. Student: Enter ID and click "পরীক্ষা শুরু করুন". The exam will run with the admin-set time limit. When time expires, the exam auto-submits.

Notes & Security
- Attempts are stored in browser localStorage. Admin actions are client-side only and protected by a simple password check in JavaScript. This is suitable for small/local use or demo.
- For secure production use (preventing tampering, protecting admin password, centralized storage), implement a backend (e.g., Node/Express + DB or Firebase) and authenticate admin securely.

If you want
- I can help change the admin password, move admin authentication server-side, or add per-exam override (admin-only) features.
- I can also provide the exact git commands to push these updated files to your GitHub Pages site.