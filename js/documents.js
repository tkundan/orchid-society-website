/* Auto-discovers documents from /Document/<category>/ folders on GitHub.
   No metadata file — the manager just drops PDFs/DOCX files into a subfolder
   and the site picks them up. Filename becomes the title.

   Reads via the public GitHub Contents API:
     https://api.github.com/repos/<owner>/<repo>/contents/<path>
*/
(function () {
  var REPO_OWNER  = 'tkundan';
  var REPO_NAME   = 'orchid-society-website';
  var REPO_BRANCH = 'main';
  var ROOT_FOLDER = 'Document';

  // Files matching these extensions are listed; everything else is hidden.
  var ALLOWED = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i;

  // Display order — anything not listed gets appended alphabetically.
  var CATEGORY_ORDER = [
    'AGM Minutes',
    'Bi-weekly Committee MoM',
    'Society Rules & Bye-laws',
    "Do's & Don'ts",
    'Financial',
    'Forms & Templates',
    'Other'
  ];

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

  // Strip extension, replace dashes/underscores with spaces, collapse whitespace.
  function fileToTitle(name) {
    var noExt = name.replace(/\.[^.]+$/, '');
    return noExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function fileExt(name) {
    var m = name.match(/\.([^.]+)$/);
    return m ? m[1].toUpperCase() : '';
  }

  function api(path) {
    var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME +
              '/contents/' + path + '?ref=' + REPO_BRANCH;
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

  function listCategories() {
    return api(ROOT_FOLDER).then(function (entries) {
      return entries.filter(function (e) { return e.type === 'dir'; });
    });
  }

  function listFiles(folderPath) {
    return api(folderPath).then(function (entries) {
      return entries
        .filter(function (e) { return e.type === 'file' && ALLOWED.test(e.name); })
        .map(function (e) {
          return {
            name: e.name,
            title: fileToTitle(e.name),
            ext: fileExt(e.name),
            size: e.size,
            path: e.path,
            url: rawUrl(e.path)
          };
        })
        .sort(function (a, b) { return b.title.localeCompare(a.title); });
    });
  }

  function renderFile(f) {
    var meta = [f.ext, formatSize(f.size)].filter(Boolean).join(' · ');
    return '<div class="doc-card">' +
      '<div class="doc-icon">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
      '</div>' +
      '<div class="doc-body">' +
        '<h3>' + escape(f.title) + '</h3>' +
        (meta ? '<p class="doc-meta">' + escape(meta) + '</p>' : '') +
      '</div>' +
      '<div class="doc-action">' +
        '<a href="' + escape(f.url) + '" class="btn" download>' +
          '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
          'Download' +
        '</a>' +
      '</div>' +
    '</div>';
  }

  function renderCategory(category, files) {
    if (!files.length) {
      return '<div class="doc-category">' +
        '<h2 class="doc-category-title">' + escape(category) + '</h2>' +
        '<p class="doc-empty">No documents uploaded yet.</p>' +
      '</div>';
    }
    return '<div class="doc-category">' +
      '<h2 class="doc-category-title">' + escape(category) + '</h2>' +
      '<div class="doc-list">' + files.map(renderFile).join('') + '</div>' +
    '</div>';
  }

  function orderCategories(names) {
    var seen = {};
    var ordered = [];
    CATEGORY_ORDER.forEach(function (cat) {
      if (names.indexOf(cat) >= 0) { ordered.push(cat); seen[cat] = true; }
    });
    names.slice().sort().forEach(function (cat) {
      if (!seen[cat]) ordered.push(cat);
    });
    return ordered;
  }

  function showError(target, msg) {
    target.innerHTML =
      '<div class="doc-error">' +
        '<p><strong>Could not load documents.</strong></p>' +
        '<p>' + escape(msg) + '</p>' +
      '</div>';
  }

  function init(target) {
    target.innerHTML = '<p class="doc-loading">Loading documents…</p>';

    listCategories()
      .then(function (cats) {
        if (!cats.length) {
          target.innerHTML = '<p class="section-desc">No document categories found yet.</p>';
          return;
        }
        var orderedNames = orderCategories(cats.map(function (c) { return c.name; }));
        // Map name → folder path
        var pathByName = {};
        cats.forEach(function (c) { pathByName[c.name] = c.path; });

        return Promise.all(orderedNames.map(function (name) {
          return listFiles(pathByName[name]).then(function (files) {
            return { name: name, files: files };
          });
        })).then(function (groups) {
          target.innerHTML = groups.map(function (g) {
            return renderCategory(g.name, g.files);
          }).join('');
        });
      })
      .catch(function (err) {
        showError(target, err.message || 'Network error');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.getElementById('documentList');
    if (target) init(target);
  });
})();
