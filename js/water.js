/* Auto-discovers monthly water reports from /TMC Water/ on GitHub.
   Drop a PNG (or JPG/PDF) into that folder each month — the site picks it up.
   Filename becomes the title. Newest month first.

   Reads via the public GitHub Contents API:
     https://api.github.com/repos/<owner>/<repo>/contents/<path>
*/
(function () {
  var REPO_OWNER  = 'tkundan';
  var REPO_NAME   = 'orchid-society-website';
  var REPO_BRANCH = 'main';
  var FOLDER      = 'TMC Water';

  var ALLOWED = /\.(png|jpe?g|pdf)$/i;

  // Match "Month YYYY" (case-insensitive) anywhere in the filename so newest month sorts first.
  var MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function fileToTitle(name) {
    var noExt = name.replace(/\.[^.]+$/, '');
    return noExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function fileExt(name) {
    var m = name.match(/\.([^.]+)$/);
    return m ? m[1].toUpperCase() : '';
  }

  // Convert a filename to a sortable YYYYMM key. Falls back to 0 if no match.
  function monthKey(name) {
    var lower = name.toLowerCase();
    var year = 0, month = 0;
    var ym = lower.match(/(\d{4})[-_ ]?(\d{2})/);
    if (ym) {
      year = parseInt(ym[1], 10);
      month = parseInt(ym[2], 10);
    } else {
      for (var i = 0; i < MONTHS.length; i++) {
        if (lower.indexOf(MONTHS[i]) >= 0) {
          month = i + 1;
          var y = lower.match(/(20\d{2})/);
          if (y) year = parseInt(y[1], 10);
          break;
        }
      }
    }
    return year * 100 + month;
  }

  function api(path) {
    var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME +
              '/contents/' + path.split('/').map(encodeURIComponent).join('/') +
              '?ref=' + REPO_BRANCH;
    return fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  function rawUrl(path) {
    return 'https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME +
           '/' + REPO_BRANCH + '/' + path.split('/').map(encodeURIComponent).join('/');
  }

  function listFiles() {
    return api(FOLDER).then(function (entries) {
      return entries
        .filter(function (e) { return e.type === 'file' && ALLOWED.test(e.name); })
        .map(function (e) {
          return {
            name: e.name,
            title: fileToTitle(e.name),
            ext: fileExt(e.name),
            size: e.size,
            path: e.path,
            url: rawUrl(e.path),
            key: monthKey(e.name)
          };
        })
        .sort(function (a, b) {
          if (b.key !== a.key) return b.key - a.key;
          return b.title.localeCompare(a.title);
        });
    });
  }

  function isImage(ext) {
    return ext === 'PNG' || ext === 'JPG' || ext === 'JPEG';
  }

  function renderFile(f) {
    var meta = [f.ext, formatSize(f.size)].filter(Boolean).join(' · ');
    var preview = isImage(f.ext)
      ? '<a class="water-preview" href="' + escape(f.url) + '" target="_blank" rel="noopener">' +
          '<img src="' + escape(f.url) + '" alt="' + escape(f.title) + '" loading="lazy">' +
        '</a>'
      : '';
    return '<article class="water-card">' +
      preview +
      '<div class="water-body">' +
        '<h3>' + escape(f.title) + '</h3>' +
        (meta ? '<p class="doc-meta">' + escape(meta) + '</p>' : '') +
        '<div class="water-actions">' +
          (isImage(f.ext)
            ? '<a href="' + escape(f.url) + '" class="btn btn-outline" target="_blank" rel="noopener">View</a>'
            : '') +
          '<a href="' + escape(f.url) + '" class="btn" download>' +
            '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            'Download' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function showError(target, msg) {
    target.innerHTML =
      '<div class="doc-error">' +
        '<p><strong>Could not load water reports.</strong></p>' +
        '<p>' + escape(msg) + '</p>' +
      '</div>';
  }

  function init(target) {
    target.innerHTML = '<p class="doc-loading">Loading water reports…</p>';

    listFiles()
      .then(function (files) {
        if (!files.length) {
          target.innerHTML = '<p class="section-desc">No water reports uploaded yet. Check back at month-end.</p>';
          return;
        }
        target.innerHTML = '<div class="water-grid">' + files.map(renderFile).join('') + '</div>';
      })
      .catch(function (err) {
        showError(target, err.message || 'Network error');
      });
  }

  function tryInit() {
    var target = document.getElementById('documentList');
    if (target) init(target);
  }

  document.addEventListener('DOMContentLoaded', tryInit);
  document.addEventListener('orchid:water-unlocked', tryInit);
})();
