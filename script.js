  // ══════════════════════════════════════════
  //  SMILECARE DENTAL — script.js
  // ══════════════════════════════════════════

  // ── SESSION STATE ONLY (no data stored here) ──
  let selectedDateDB = '';
  let isLoggedIn  = false;
  let isAdmin     = false;
  let currentUser  = '';
  let currentEmail = '';

  // Booking UI state (ephemeral, not persisted)
  let selectedDentist = 'Dr. Reyes';
  let selectedDate    = null;
  let selectedDateStr = '—';
  let calYear  = 2026;
  let calMonth = 4; // May 2026

  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Dashboard filter
  let dashFilter = 'all';

  // ══════════════════════════════════════════
  //  NAVIGATION
  // ══════════════════════════════════════════
  function saveSession() {
  localStorage.setItem('smilecare_user', JSON.stringify({  // ✅ localStorage
    isLoggedIn, isAdmin, currentUser, currentEmail
  }));
}

// Restore session on refresh
const _sess = localStorage.getItem('smilecare_user');      // ✅ localStorage
if (_sess) {
  const s = JSON.parse(_sess);
  isLoggedIn   = s.isLoggedIn;
  isAdmin      = s.isAdmin;
  currentUser  = s.currentUser;
  currentEmail = s.currentEmail;
  updateNav();                                      // ✅ update the nav UI
  navigate(isAdmin ? 'dashboard' : 'home'); 
}

  function navigate(page) {
    if ((page === 'book' || page === 'appts') && !isLoggedIn) { navigate('signin'); return; }
    if (page === 'dashboard' && !isAdmin) { navigate('signin'); return; }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');

    ['home', 'book', 'appts'].forEach(id => {
      const el = document.getElementById('nav-' + id);
      if (el) el.classList.toggle('active', id === page);
    });

    if (page === 'book')      { renderCalendar(); updateSummary(); }
    if (page === 'appts')     renderMyAppts();
    if (page === 'dashboard') renderDashboard();
  }
   
  // ══════════════════════════════════════════
  //  AUTH HELPERS
  // ══════════════════════════════════════════
  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
  }
  
  // ══════════════════════════════════════════
  //  SIGN IN
  // ══════════════════════════════════════════
  async function doSignIn() {
    clearErrors();
    const email = document.getElementById('si-email').value.trim().toLowerCase();
    const pass  = document.getElementById('si-pass').value;
    if (!email) { showError('si-error', 'Please enter your email.'); return; }
    if (!pass)  { showError('si-error', 'Please enter your password.'); return; }

    try {
      const res = await fetch('api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) { showError('si-error', data.message || 'Invalid email or password.'); return; }

      isLoggedIn   = true;
      isAdmin      = false;
      currentUser  = data.fullName;  // ✅ changed this line
      currentEmail = email;
      saveSession();
      updateNav();
      navigate('home');
    } catch (err) {
      showError('si-error', 'Could not connect to server. Please try again.');
    }
  }
     
  // ══════════════════════════════════════════
  //  ADMIN LOGIN
  // ══════════════════════════════════════════
  async function doAdminLogin() {
    clearErrors();
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value;
    if (!user || !pass) { showError('al-error', 'Please enter admin credentials.'); return; }

    try {
      const res = await fetch('api/auth/admin-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (!res.ok) { showError('al-error', data.message || 'Invalid admin username or password.'); return; }

      isLoggedIn   = true;
      isAdmin      = true;
      currentUser  = 'Admin';
      currentEmail = 'admin';
      saveSession();
      updateNav();
      navigate('dashboard');
    } catch (err) {
      showError('al-error', 'Could not connect to server. Please try again.');
    }
  }

  // ══════════════════════════════════════════
  //  REGISTER
  // ══════════════════════════════════════════

  document.getElementById('reg-phone').addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, ''); // strip non-digits
  });


  async function doRegister() {
    clearErrors();
    const first  = document.getElementById('reg-firstname').value.trim();
    const last   = document.getElementById('reg-lastname').value.trim();
    const email  = document.getElementById('reg-email').value.trim().toLowerCase();
    document.getElementById('reg-username-hint').value = email;
    const phone  = document.getElementById('reg-phone').value.trim();
    const dob    = document.getElementById('reg-dob').value;
    const gender = document.getElementById('reg-gender').value;
    const pass   = document.getElementById('reg-pass').value;

    if (!first || !last) { showError('reg-error', 'Please enter your first and last name.'); return; }
    if (!email)          { showError('reg-error', 'Please enter your email address.'); return; }
    const emailDomain = email.split('@')[1];
    if (!['gmail.com', 'yahoo.com'].includes(emailDomain)) {
    showError('reg-error', 'Only @gmail.com or @yahoo.com email addresses are allowed.');
    return;
    }
    if (!phone) { showError('reg-error', 'Please enter your phone number.'); return; }
    if (!/^[0-9]{11}$/.test(phone)) { showError('reg-error', 'Phone number must be exactly 11 digits (e.g. 09190923209).'); return; }
    if (!phone.startsWith('09')) { showError('reg-error', 'Phone number must start with 09 (e.g. 09190923209).'); return; }
    if (!dob)            { showError('reg-error', 'Please select your date of birth.'); return; }
    if (!gender)         { showError('reg-error', 'Please select your gender.'); return; }
    if (!pass)           { showError('reg-error', 'Please enter a password.'); return; }

    try {
      const res = await fetch('api/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: first, lastName: last, email, phone, dob, gender, password: pass })
      });
      const data = await res.json();
      if (!res.ok) { showError('reg-error', data.message || 'Registration failed.'); return; }

      isLoggedIn   = true;
      isAdmin      = false;
      currentUser  = first + ' ' + last;
      currentEmail = email;
      saveSession();
      updateNav();
      navigate('home');
    } catch (err) {
      showError('reg-error', 'Could not connect to server. Please try again.');
    }
  }

  // ══════════════════════════════════════════
  //  LOGOUT
  // ══════════════════════════════════════════
  function logout() {
  isLoggedIn = false; isAdmin = false;
  currentUser = ''; currentEmail = '';
  localStorage.removeItem('smilecare_user');  // ✅ add this line
  updateNav();
  navigate('home');
}

  // ══════════════════════════════════════════
  //  UPDATE NAV UI
  // ══════════════════════════════════════════
  function updateNav() {
    const loggedIn = isLoggedIn;
    document.getElementById('nav-signin').style.display    = loggedIn ? 'none' : '';
    document.getElementById('nav-register').style.display  = loggedIn ? 'none' : '';
    document.getElementById('nav-logout').style.display    = loggedIn ? '' : 'none';
    document.getElementById('nav-username').style.display  = loggedIn ? '' : 'none';
    document.getElementById('nav-username').textContent    = currentUser;
    document.getElementById('nav-admin-badge').style.display = isAdmin ? '' : 'none';
    document.getElementById('nav-book').style.display      = (loggedIn && !isAdmin) ? '' : 'none';
    document.getElementById('nav-appts').style.display     = (loggedIn && !isAdmin) ? '' : 'none';
    document.getElementById('nav-dashboard').style.display = isAdmin ? '' : 'none';
  }

  // ══════════════════════════════════════════
  //  BOOKING
  // ══════════════════════════════════════════
  function bookService(name, price) {
    if (!isLoggedIn) { navigate('signin'); return; }
    const sel = document.getElementById('book-service');
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value.startsWith(name + '|')) { sel.selectedIndex = i; break; }
    }
    navigate('book');
  }

  function selectDentist(el, name) {
    document.querySelectorAll('.dentist-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedDentist = name;
    document.getElementById('sum-dentist').textContent = name;

    if (selectedDate) {
      loadBookedSlots(selectedDateDB).then(bookedTimes => applyBookedSlots(bookedTimes)); // ✅ use DB format
    }
  }

  function selectTime(el) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('sum-time').textContent = el.textContent;
  }

  function updateSummary() {
    const val = document.getElementById('book-service').value;
    const [svc, price] = val.split('|');
    document.getElementById('sum-service').textContent = svc   || '—';
    document.getElementById('sum-price').textContent   = price || '—';
  }

  async function confirmBooking() {
    if (!isLoggedIn) { navigate('signin'); return; }
    const val   = document.getElementById('book-service').value;
    const [svc, price] = val.split('|');
    const time  = document.querySelector('.time-slot.selected')?.textContent || '9:00 AM';
    const notes = document.getElementById('book-notes').value.trim();
    if (!selectedDate) { alert('Please select a date.'); return; }

    try {
      const res = await fetch('api/appointments/create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: currentEmail,
          service: svc, price,
          dentist: selectedDentist,
          date: selectedDateDB,
          time, notes: notes || '—'
        })
      });
      const data = await res.json(); // ✅ added
      if (!res.ok) { alert(data.message || 'Failed to book appointment.'); return; } // ✅ shows slot taken

      document.getElementById('book-notes').value = '';
      selectedDate = null; selectedDateStr = '—';
      document.getElementById('sum-date').textContent = '—';
      alert('✅ Appointment submitted! It is now Pending admin approval.');
      navigate('appts');
    } catch (err) {
      alert('Could not connect to server. Please try again.');
    }
  }

  async function loadBookedSlots(dateStr) {
    try {
      const res = await fetch(`api/appointments/booked-slots.php?dentist=${encodeURIComponent(selectedDentist)}&date=${encodeURIComponent(dateStr)}`);
      const data = await res.json();
      return data.bookedTimes || [];
    } catch {
      return [];
    }
  }

  function applyBookedSlots(bookedTimes) {
    document.querySelectorAll('.time-slot').forEach(slot => {
      const slotTime = slot.textContent.trim();
      if (bookedTimes.includes(slotTime)) {
        slot.classList.add('disabled');
        slot.classList.remove('selected');
        slot.onclick = null;
      } else {
        slot.classList.remove('disabled');
        slot.onclick = () => selectTime(slot);
      }
    });
  }

  async function onDateSelected(d, el) {
    selectedDate = d;
    document.querySelectorAll('.cal-day').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');

    const dow = DAY_SHORT[new Date(calYear, calMonth, d).getDay()];
    selectedDateStr = dow + ', ' + MONTH_FULL[calMonth] + ' ' + d + ', ' + calYear;

    // ✅ YYYY-MM-DD for DB
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    selectedDateDB = calYear + '-' + mm + '-' + dd;

    document.getElementById('sum-date').textContent = selectedDateStr;

    const bookedTimes = await loadBookedSlots(selectedDateDB);
    applyBookedSlots(bookedTimes);
  }
  // ══════════════════════════════════════════
  //  CALENDAR
  // ══════════════════════════════════════════
  function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';
    document.getElementById('cal-month-label').textContent = MONTH_SHORT[calMonth] + ' ' + calYear;

    ['MON','TUE','WED','THU','FRI','SAT','SUN'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-day-name';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const offset      = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < offset; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      grid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;
      if (d === selectedDate) el.classList.add('selected');

      // ✅ UPDATED: replaced inline logic with onDateSelected
      el.onclick = () => onDateSelected(d, el);

      grid.appendChild(el);
    }
  }

  function changeMonth(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0)  { calMonth = 11; calYear--; }
    renderCalendar();
  }

  async function renderMyAppts() {
    const wrap = document.getElementById('appt-list-wrap');
    wrap.innerHTML = '<p style="color:var(--gray-400);padding:20px 0">Loading...</p>';

    try {
      const res  = await fetch(`api/appointments/my-appointments.php?email=${currentEmail}`);
      const mine = await res.json();

      if (mine.length === 0) {
        wrap.innerHTML = `<div class="empty-appts"><p>You have no appointments yet.</p><button class="new-btn" onclick="navigate('book')">+ Book Now</button></div>`;
        return;
      }

      const dotColor = { Confirmed: 'green', Pending: 'yellow', Rejected: 'red', Cancelled: 'red' };
      wrap.innerHTML = `<div class="appt-list">${mine.map(a => `
        <div class="appt-card">
          <div class="appt-dot ${dotColor[a.status] || 'yellow'}"></div>
          <div class="appt-info">
            <strong>${a.service}</strong>
            <span>${a.dentist} · ${a.date} · ${a.time}</span>
          </div>
          <div class="appt-actions">
            <span class="badge ${a.status.toLowerCase()}">${a.status}</span>
            ${a.status === 'Pending' ? `<button class="action-btn cancel" onclick="cancelAppt(${a.id})">Cancel</button>` : ''}
          </div>
        </div>`).join('')}
      </div>`;
    } catch (err) {
      wrap.innerHTML = '<p style="color:red;padding:20px 0">Failed to load appointments.</p>';
    }
  }

  async function cancelAppt(id) {
    if (!confirm('Cancel this appointment?')) return;

    try {
      const res = await fetch(`api/appointments/cancel.php?id=${id}`, { method: 'PATCH' });
      if (!res.ok) { alert('Failed to cancel.'); return; }
      renderMyAppts();
    } catch (err) {
      alert('Could not connect to server. Please try again.');
    }
  }

  // ══════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ══════════════════════════════════════════
  function setFilter(f, btn) {
    dashFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDashboard();
  }

  async function renderDashboard() {
    try {
      const res          = await fetch('api/appointments/all.php');
      const appointments = await res.json();

      const total     = appointments.length;
      const pending   = appointments.filter(a => a.status === 'Pending').length;
      const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
      const rejected  = appointments.filter(a => a.status === 'Rejected').length;

      document.getElementById('stat-total').textContent     = total;
      document.getElementById('stat-pending').textContent   = pending;
      document.getElementById('stat-confirmed').textContent = confirmed;
      document.getElementById('stat-rejected').textContent  = rejected;
      document.getElementById('dash-welcome').textContent   = 'Welcome, Admin';

      const list = dashFilter === 'all'
        ? appointments
        : appointments.filter(a => a.status === dashFilter);

      const rows = document.getElementById('dash-rows');
      if (list.length === 0) {
        rows.innerHTML = `<div class="empty-dash">No appointments found.</div>`;
        return;
      }

      rows.innerHTML = list.map(a => {
        let actionHtml = '';
        if (a.status === 'Pending') {
          actionHtml = `
            <button class="btn-approve" onclick="approveAppt(${a.id})">✓ Approve</button>
            <button class="btn-reject"  onclick="rejectAppt(${a.id})">✕ Reject</button>`;
        } else if (a.status === 'Confirmed') {
          actionHtml = `<span class="btn-approved-tag">✓ Approved</span>`;
        } else if (a.status === 'Rejected') {
          actionHtml = `<span class="btn-rejected-tag">✕ Rejected</span>`;
        } else {
          actionHtml = `<span style="font-size:0.78rem;color:var(--gray-400)">${a.status}</span>`;
        }
        return `
          <div class="table-row">
            <div>
              <div class="tr-service">${a.service}</div>
              <div class="tr-patient" style="font-size:0.72rem;color:var(--gray-400)">${a.price}</div>
            </div>
            <div>
              <div class="tr-meta" style="font-weight:600;color:var(--gray-800)">${a.patientName}</div>
              <div class="tr-meta">${a.patientEmail || a.patient_email || '—'}</div>
              <div class="tr-meta" style="font-size:0.75rem;color:var(--gray-400)">📱 ${a.patientPhone || 'No phone'}</div>
            </div>
            <div class="tr-meta">${a.dentist}</div>
            <div class="tr-meta">${a.date}</div>
            <div class="tr-meta">${a.time}</div>
            <div class="tr-meta" style="font-size:0.78rem;color:var(--gray-600);font-style:italic">${a.notes && a.notes !== '—' ? a.notes : '<span style="color:var(--gray-400)">—</span>'}</div>
            <div class="row-btns">${actionHtml}</div>
          </div>
        `}).join('');
    } catch (err) {
      document.getElementById('dash-rows').innerHTML = '<div class="empty-dash">Failed to load appointments.</div>';
    }
  }

  async function approveAppt(id) {
  try {
    const res = await fetch(`api/appointments/approve.php?id=${id}`, { method: 'PATCH' });
    if (!res.ok) { alert('Failed to approve.'); return; }
    renderDashboard();
  } catch (err) {
    alert('Could not connect to server. Please try again.');
  }
}

async function rejectAppt(id) {
  if (!confirm('Reject this appointment?')) return;
  try {
    const res = await fetch(`api/appointments/reject.php?id=${id}`, { method: 'PATCH' });
    if (!res.ok) { alert('Failed to reject.'); return; }
    renderDashboard();
  } catch (err) {
    alert('Could not connect to server. Please try again.');
  }
}