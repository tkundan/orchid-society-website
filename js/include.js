/* Tiny HTML include loader.
   Usage: <div data-include="partials/nav.html"></div>
   Add <body data-page="committee"> to highlight the matching nav link. */
(function () {
  function setActive(root) {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    var link = root.querySelector('a[data-page="' + page + '"]');
    if (link) link.classList.add('active');
  }

  function load(el) {
    var url = el.getAttribute('data-include');
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        el.outerHTML = html;
      })
      .catch(function () { /* ignore */ });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var slots = document.querySelectorAll('[data-include]');
    Promise.all(Array.prototype.map.call(slots, load)).then(function () {
      setActive(document);
    });
  });
})();
