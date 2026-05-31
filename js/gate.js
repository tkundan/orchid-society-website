/* Password gate for the Documents page.
   The expected password lives in content/access.txt (one line, plain text).
   To change it: edit that file on GitHub and commit. No code change needed.

   IMPORTANT — this is NOT real security.
   The password and the file URLs are visible in browser dev tools.
   It only stops casual visitors from browsing the document list.
*/
(function () {
  var STORAGE_KEY  = 'orchid-doc-access';
  var SESSION_HRS  = 12; // re-prompt after this many hours
  var ACCESS_FILE  = 'content/access.txt';

  function unlocked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.until) return false;
      var until = parseInt(data.until, 10);
      // Use page-load instant; Date.now is fine in browser code (not workflow scripts)
      return until > Date.now();
    } catch (_) {
      return false;
    }
  }

  function persist() {
    try {
      var until = Date.now() + SESSION_HRS * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ until: until }));
    } catch (_) { /* private mode — no-op */ }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function fetchPassword() {
    return fetch(ACCESS_FILE, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (txt) { return txt.replace(/[\r\n]+/g, '').trim(); });
  }

  function showGate(target) {
    target.innerHTML =
      '<div class="gate">' +
        '<div class="gate-icon">🔒</div>' +
        '<h2>Residents Only</h2>' +
        '<p class="gate-hint">Enter the access code to view society documents.</p>' +
        '<form class="gate-form" id="gateForm">' +
          '<input type="password" inputmode="numeric" autocomplete="off" ' +
                 'class="gate-input" id="gateInput" placeholder="Access code" autofocus>' +
          '<button type="submit" class="gate-button">Unlock</button>' +
          '<div class="gate-error" id="gateError" role="alert"></div>' +
        '</form>' +
        '<p class="gate-footer">Don\'t have the code? Email ' +
          '<a href="mailto:orchidjwing@gmail.com">orchidjwing@gmail.com</a></p>' +
      '</div>';

    var form  = document.getElementById('gateForm');
    var input = document.getElementById('gateInput');
    var error = document.getElementById('gateError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var attempt = input.value.trim();
      error.textContent = 'Checking…';

      fetchPassword().then(function (expected) {
        if (!expected) {
          error.textContent = 'Could not verify access code. Please try again later.';
          return;
        }
        if (attempt === expected) {
          persist();
          unlock(target);
        } else {
          error.textContent = 'Incorrect code. Please try again.';
          input.value = '';
          input.focus();
        }
      }).catch(function () {
        error.textContent = 'Could not verify access code. Please try again later.';
      });
    });
  }

  function unlock(target) {
    target.innerHTML =
      '<div style="text-align:right; margin-bottom: 18px;">' +
        '<button type="button" class="gate-logout" id="gateLogout">' +
          '🔓 Unlocked · Lock again' +
        '</button>' +
      '</div>' +
      '<div id="documentList"></div>';

    document.getElementById('gateLogout').addEventListener('click', function () {
      clearSession();
      showGate(target);
    });

    // Tell documents.js to render now that #documentList exists
    document.dispatchEvent(new CustomEvent('orchid:unlocked'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.getElementById('gate');
    if (!target) return;
    if (unlocked()) {
      unlock(target);
    } else {
      showGate(target);
    }
  });
})();
