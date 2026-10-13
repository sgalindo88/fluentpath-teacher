(function() {
  var WEBHOOK_URL = FP.WEBHOOK_URL;
  var listEl = document.getElementById('studentList');

  function show(view) {
    document.getElementById('loginView').classList.toggle('fp-hidden', view !== 'login');
    document.getElementById('portalView').classList.toggle('fp-hidden', view !== 'portal');
  }

  // An 'Unauthorized' reply while we are on this page means: show the login form (not reload).
  FP.isLoginPage = true;
  FP.onLoginRequired = function () { show('login'); };

  function isTeacher() {
    return !!(FP.getSession && FP.getSession()) && localStorage.getItem(FP.KEYS.ROLE) === 'teacher';
  }

  function setMsg(el, text, ok) {
    el.textContent = text;
    el.className = 'auth-msg ' + (ok ? 'ok' : 'err') + (text ? '' : ' fp-hidden');
  }

  // ── Login / logout ──
  window.teacherLogin = async function() {
    var email = (document.getElementById('tEmail').value || '').trim();
    var pw = document.getElementById('tPassword').value || '';
    var err = document.getElementById('tLoginError');
    var btn = document.getElementById('tLoginBtn');
    setMsg(err, '');
    if (!email || !pw) { setMsg(err, 'Enter your email and password.'); return; }
    // Hashing takes a few seconds server-side — show progress so the button
    // doesn't look dead, and block double-submits (which trip the rate limit).
    if (btn.disabled) return; // guard against double-submit
    var btnLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    try {
      var res = await FP.api.postRead(WEBHOOK_URL + '?action=login', { email: email, password: pw });
      if (!res || !res.ok) { setMsg(err, (res && res.error) || 'Login failed.'); return; }
      if (res.role !== 'teacher') { setMsg(err, 'This is not a teacher account.'); return; }
      localStorage.setItem(FP.KEYS.SESSION, res.session);
      if (res.expires_at) localStorage.setItem(FP.KEYS.SESSION_EXP, res.expires_at);
      localStorage.setItem(FP.KEYS.ROLE, res.role);
      show('portal');
      loadStudents();
      loadAccountRequests();
      loadFeedback();
      loadArchived();
    } catch (e) {
      setMsg(err, 'Could not reach the server. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = btnLabel;
    }
  };

  window.teacherLogout = function() {
    var s = FP.getSession && FP.getSession();
    if (s) { try { FP.api.postRead(WEBHOOK_URL + '?action=logout', { session: s }); } catch (e) { /* ignore */ } }
    if (FP.clearSession) FP.clearSession();
    show('login');
  };

  // ── Create student account ──
  window.createStudentAccount = async function() {
    var name = (document.getElementById('caName').value || '').trim();
    var email = (document.getElementById('caEmail').value || '').trim();
    var pw = document.getElementById('caPassword').value || '';
    var st = document.getElementById('caStatus');
    var btn = document.getElementById('caBtn');
    setMsg(st, '');
    if (!name || !email) { setMsg(st, 'Name and email are required.'); return; }
    if (btn.disabled) return; // guard against double-submit
    var btnLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creating…';
    try {
      var res = await FP.api.postRead(WEBHOOK_URL + '?action=create_account',
        { student_name: name, email: email, password: pw, role: 'student' });
      if (res && res.ok) {
        // Say what happens next: the student can log in now, but the course is locked until the
        // teacher switches on free access in the student's profile.
        st.className = 'auth-msg ok';
        var next = res.emailed
          ? 'We emailed ' + escHtml(email) + ' a link to choose their own password (it works for 7 days). '
          : 'The email could not be sent, so ' + (pw ? 'give them the password you typed, or ' : '') +
            'ask them to tap "Forgot password?" on the log in page. ';
        st.innerHTML = 'Account created for ' + escHtml(name) + '. ' + next +
          '<a class="link" href="src/examiner-panel.html?student=' + encodeURIComponent(name) + '">Open their dashboard</a>' +
          ' to switch on free course access (Student Profile).';
        document.getElementById('caName').value = '';
        document.getElementById('caEmail').value = '';
        document.getElementById('caPassword').value = '';
        loadStudents();
        loadAccountRequests();
      } else {
        setMsg(st, (res && (res.error || res.message)) || 'Could not create account.');
      }
    } catch (e) {
      setMsg(st, (e.message || 'Could not create account.') + ' The account may still have been created: check the list above (and try logging in) before creating it again.');
      loadStudents();
    } finally {
      btn.disabled = false;
      btn.textContent = btnLabel;
    }
  };

  // ── Inbox: account requests from the brochure, and student feedback ──
  function shortDate(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  async function loadAccountRequests() {
    var box = document.getElementById('acctRequests');
    var list = document.getElementById('acctReqList');
    try {
      var data = await FP.api.get(WEBHOOK_URL + '?action=get_account_requests');
      var reqs = (data && data.requests) || [];
      box.classList.toggle('fp-hidden', !reqs.length);
      list.innerHTML = reqs.map(function(r) {
        return '<li class="inbox-item" data-id="' + escHtml(r.id) + '">' +
          '<div class="inbox-item__main"><strong>' + escHtml(r.name) + '</strong> ' +
          '<span class="inbox-meta">' + escHtml(r.email) + ' · ' + escHtml(shortDate(r.requested_at)) +
          ' · ' + (r.language === 'es' ? 'Spanish' : 'English') + '</span>' +
          (r.note ? '<div class="inbox-note">&ldquo;' + escHtml(r.note) + '&rdquo;</div>' : '') + '</div>' +
          '<div class="inbox-actions">' +
          '<button type="button" class="fp-btn fp-btn--primary" data-act="create">Create account</button>' +
          '<button type="button" class="fp-btn fp-btn--secondary" data-act="dismiss">Dismiss</button></div></li>';
      }).join('');
      list._reqs = reqs;
    } catch (e) { box.classList.add('fp-hidden'); }
  }

  document.getElementById('acctReqList').addEventListener('click', async function(ev) {
    var btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    var li = btn.closest('li');
    var req = (this._reqs || []).filter(function(r) { return String(r.id) === li.getAttribute('data-id'); })[0];
    if (!req) return;
    if (btn.getAttribute('data-act') === 'create') {
      document.getElementById('caName').value = req.name;
      document.getElementById('caEmail').value = req.email;
      document.getElementById('caPassword').focus();
      document.getElementById('caPassword').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    btn.disabled = true;
    try {
      await FP.api.postRead(WEBHOOK_URL + '?action=update_account_request', { id: req.id, status: 'dismissed' });
      loadAccountRequests();
    } catch (e) { btn.disabled = false; }
  });

  function feedbackItem(f) {
    var done = f.status === 'done';
    return '<li class="inbox-item' + (done ? ' is-done' : '') + '" data-id="' + escHtml(f.id) + '">' +
      '<div class="inbox-item__main"><span class="fp-badge ' + (f.type === 'bug' ? 'fp-badge--warning' : '') + '">' +
      (f.type === 'bug' ? 'Problem' : 'Feature idea') + '</span> <strong>' + escHtml(f.student_name) + '</strong> ' +
      '<span class="inbox-meta">' + escHtml(shortDate(f.submitted_at)) + (f.device ? ' · ' + escHtml(f.device.slice(0, 70)) : '') + '</span>' +
      '<div class="inbox-note">' + escHtml(f.message) + '</div></div>' +
      '<div class="inbox-actions"><button type="button" class="fp-btn fp-btn--secondary" data-act="' + (done ? 'reopen' : 'done') + '">' +
      (done ? 'Reopen' : 'Mark done') + '</button></div></li>';
  }

  async function loadFeedback() {
    var box = document.getElementById('feedbackBox');
    try {
      var data = await FP.api.get(WEBHOOK_URL + '?action=get_feedback');
      var all = (data && data.feedback) || [];
      var open = all.filter(function(f) { return f.status !== 'done'; });
      var done = all.filter(function(f) { return f.status === 'done'; });
      box.classList.toggle('fp-hidden', !all.length);
      document.getElementById('feedbackList').innerHTML = open.length
        ? open.map(feedbackItem).join('')
        : '<li class="inbox-empty">Nothing waiting.</li>';
      document.getElementById('feedbackDone').classList.toggle('fp-hidden', !done.length);
      document.getElementById('feedbackDoneSummary').textContent = 'Done (' + done.length + ')';
      document.getElementById('feedbackDoneList').innerHTML = done.map(feedbackItem).join('');
    } catch (e) { box.classList.add('fp-hidden'); }
  }

  document.getElementById('feedbackBox').addEventListener('click', async function(ev) {
    var btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await FP.api.postRead(WEBHOOK_URL + '?action=update_feedback',
        { id: btn.closest('li').getAttribute('data-id'), status: btn.getAttribute('data-act') === 'done' ? 'done' : 'new' });
      loadFeedback();
    } catch (e) { btn.disabled = false; }
  });

  async function loadArchived() {
    var box = document.getElementById('archivedBox');
    try {
      var data = await FP.api.get(WEBHOOK_URL + '?action=get_archived_students');
      var list = (data && data.students) || [];
      box.classList.toggle('fp-hidden', !list.length);
      document.getElementById('archivedSummary').textContent = 'Archived students (' + list.length + ')';
      document.getElementById('archivedList').innerHTML = list.map(function(st) {
        return '<li class="inbox-item" data-name="' + escHtml(st.name) + '">' +
          '<div class="inbox-item__main"><strong>' + escHtml(st.name) + '</strong> <span class="inbox-meta">' + escHtml(st.email) + '</span></div>' +
          '<div class="inbox-actions">' +
          '<button type="button" class="fp-btn fp-btn--primary" data-act="restore">Restore</button>' +
          '<a class="fp-btn fp-btn--secondary" href="src/examiner-panel.html?student=' + encodeURIComponent(st.name) + '">Open</a></div></li>';
      }).join('');
    } catch (e) { box.classList.add('fp-hidden'); }
  }

  document.getElementById('archivedList').addEventListener('click', async function(ev) {
    var btn = ev.target.closest('button[data-act="restore"]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await FP.api.postRead(WEBHOOK_URL + '?action=restore_student', { student_name: btn.closest('li').getAttribute('data-name') });
      loadArchived();
      loadStudents();
    } catch (e) { btn.disabled = false; }
  });

  // ── Student picker ──
  async function loadStudents() {
    try {
      var data = await FP.api.get(WEBHOOK_URL + '?action=get_students');
      if (!data || !data.students || data.students.length === 0) {
        listEl.innerHTML = '<div class="empty-msg">No students yet.<br>Create one below, or they appear here after their first visit.</div>';
        return;
      }
      listEl.innerHTML = '';
      data.students.forEach(function(s) {
        var card = document.createElement('a');
        card.className = 'student-card';
        card.href = 'src/examiner-panel.html?student=' + encodeURIComponent(s.name);
        card.innerHTML =
          '<div class="student-name">' + escHtml(s.name) + '</div>' +
          '<span class="student-arrow">' + FP.icon('arrow_right_alt') + '</span>';
        listEl.appendChild(card);
      });
    } catch (e) {
      listEl.innerHTML = '<div class="empty-msg">Could not load students.<br>' + escHtml(e.message) + '</div>';
    }
  }

  // ── Init ──
  if (isTeacher()) { show('portal'); loadStudents(); loadAccountRequests(); loadFeedback(); loadArchived(); }
  else { show('login'); }
})();
