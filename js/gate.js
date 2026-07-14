/* Password gate for gated pages (Documents, Water Report, etc.).
   Access codes live in the file referenced by data-access-file
   on the #gate element (e.g. content/access.txt).

   File format — one entry per line:
     Name:Code
   Blank lines and lines starting with # are ignored.
   A line without a colon is treated as an anonymous single code
   (kept for backwards compatibility with the old format).

   Any listed code unlocks the page. The matched name is stored
   locally so we display "Unlocked as <name>" and, if GoatCounter
   is loaded, record an event tagged with the name — this gives
   basic audit visibility of who accessed the page.

   IMPORTANT — this is NOT real security.
   The file and all codes are visible in browser dev tools.
   It only stops casual visitors from browsing the list.
*/
(function () {
  var SESSION_HRS  = 12; // re-prompt after this many hours

  var STORAGE_KEY  = 'orchid-doc-access';
  var ACCESS_FILE  = 'content/access.txt';
  var UNLOCK_EVENT = 'orchid:unlocked';
  var LOCK_EVENT   = 'orchid:locked';
  var GATE_TITLE   = 'Residents Only';
  var GATE_HINT    = 'Enter the access code to view society documents.';

  function readSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.until) return null;
      if (parseInt(data.until, 10) <= Date.now()) return null;
      return data;
    } catch (_) { return null; }
  }

  function persist(name) {
    try {
      var until = Date.now() + SESSION_HRS * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ until: until, name: name || '' }));
    } catch (_) { /* private mode — no-op */ }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function parseEntries(txt) {
    return txt.split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l && l.charAt(0) !== '#'; })
      .map(function (l) {
        var idx = l.indexOf(':');
        if (idx === -1) return { name: '', code: l };
        return { name: l.slice(0, idx).trim(), code: l.slice(idx + 1).trim() };
      })
      .filter(function (e) { return e.code; });
  }

  function fetchEntries() {
    return fetch(ACCESS_FILE, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (txt) { return parseEntries(txt); });
  }

  function recordUnlock(name) {
    if (!name) return;
    var gc = window.goatcounter;
    if (!gc || typeof gc.count !== 'function') return;
    try {
      gc.count({
        path: 'unlock/' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: 'Access unlocked: ' + name,
        event: true
      });
    } catch (_) {}
  }

  function showGate(target) {
    target.innerHTML =
      '<div class="gate">' +
        '<div class="gate-icon">🔒</div>' +
        '<h2>' + GATE_TITLE + '</h2>' +
        '<p class="gate-hint">' + GATE_HINT + '</p>' +
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

      fetchEntries().then(function (entries) {
        if (!entries.length) {
          error.textContent = 'Could not verify access code. Please try again later.';
          return;
        }
        var match = null;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].code === attempt) { match = entries[i]; break; }
        }
        if (match) {
          persist(match.name);
          recordUnlock(match.name);
          unlock(target, match.name);
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

  function unlock(target, name) {
    var label = name
      ? '🔓 Unlocked as ' + name + ' · Lock again'
      : '🔓 Unlocked · Lock again';
    target.innerHTML =
      '<div style="text-align:right; margin-bottom: 18px;">' +
        '<button type="button" class="gate-logout" id="gateLogout">' +
          label +
        '</button>' +
      '</div>' +
      '<div id="documentList"></div>';

    document.getElementById('gateLogout').addEventListener('click', function () {
      clearSession();
      showGate(target);
      document.dispatchEvent(new CustomEvent(LOCK_EVENT));
    });

    document.dispatchEvent(new CustomEvent(UNLOCK_EVENT, { detail: { name: name || '' } }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.getElementById('gate');
    if (!target) return;
    if (target.dataset.storageKey)  STORAGE_KEY  = target.dataset.storageKey;
    if (target.dataset.accessFile)  ACCESS_FILE  = target.dataset.accessFile;
    if (target.dataset.unlockEvent) UNLOCK_EVENT = target.dataset.unlockEvent;
    if (target.dataset.lockEvent)   LOCK_EVENT   = target.dataset.lockEvent;
    if (target.dataset.gateTitle)   GATE_TITLE   = target.dataset.gateTitle;
    if (target.dataset.gateHint)    GATE_HINT    = target.dataset.gateHint;
    var session = readSession();
    if (session) {
      unlock(target, session.name);
    } else {
      showGate(target);
    }
  });
})();
