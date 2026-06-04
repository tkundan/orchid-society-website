/* Simple visitor counter using the free abacus.jasoncameron.dev API.
   Increments once per browser session, then shows the running total
   inside the #visitor-count element rendered by partials/footer.html. */
(function () {
  var NAMESPACE = 'orchid-society-website';
  var KEY = 'site-visits';
  var SESSION_FLAG = 'orchid_visit_counted';
  var BASE = 'https://abacus.jasoncameron.dev';

  function render(value) {
    var el = document.getElementById('visitor-count');
    if (!el) return;
    el.textContent = (typeof value === 'number')
      ? value.toLocaleString()
      : '—';
  }

  function fetchCount() {
    var counted = false;
    try { counted = sessionStorage.getItem(SESSION_FLAG) === '1'; } catch (e) {}

    var url = BASE + (counted ? '/get/' : '/hit/') + NAMESPACE + '/' + KEY;

    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && typeof data.value === 'number') {
          render(data.value);
          if (!counted) {
            try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) {}
          }
        } else {
          render(null);
        }
      })
      .catch(function () { render(null); });
  }

  function waitForElement() {
    if (document.getElementById('visitor-count')) {
      fetchCount();
      return;
    }
    // Footer is injected by include.js after DOMContentLoaded — poll briefly.
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (document.getElementById('visitor-count')) {
        clearInterval(iv);
        fetchCount();
      } else if (tries > 40) {
        clearInterval(iv);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElement);
  } else {
    waitForElement();
  }
})();
