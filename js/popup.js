/* Pop-up notice loader.
   Reads content/popup.md and shows a modal on first page load if there's content.
   Once a resident dismisses it, they don't see the SAME notice again — but they
   DO see the next one when the committee updates the file. (Tracked by hashing
   the body content; new content = new hash = new popup.)
*/
(function () {
  var POPUP_FILE = 'content/popup.md';
  var STORAGE_KEY = 'orchid-popup-dismissed';

  // Tiny non-crypto hash, sufficient for "did this content change?"
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inline(text) {
    var s = escape(text);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
      var safe = href.replace(/"/g, '&quot;');
      var ext  = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + safe + '"' + ext + '>' + label + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  // A "key: value" or "**key:** value" pattern → render as a styled info row.
  function isInfoRow(line) {
    return /^\s*(?:\*\*)?[A-Za-z][\w\s]*:?(?:\*\*)?\s*[:\-—]\s+\S/.test(line) ||
           /^\s*\*\*[^*]+:\*\*\s+\S/.test(line);
  }

  function renderInfoRow(line) {
    // Match "**Label:** value" or "Label: value"
    var m = line.match(/^\s*(?:\*\*)?\s*([^:*]+?)\s*:?\s*(?:\*\*)?\s*[:\-—]\s+(.+)$/);
    if (!m) {
      m = line.match(/^\s*\*\*\s*([^:]+?)\s*:?\s*\*\*\s*(.+)$/);
    }
    if (!m) return null;
    return '<div class="popup-row">' +
      '<span class="popup-row-label">' + escape(m[1].trim()) + '</span>' +
      '<span class="popup-row-value">' + escape(m[2].trim()) + '</span>' +
    '</div>';
  }

  function renderParagraph(p) {
    // Try to render as a stack of info rows if every line matches the pattern
    var lines = p.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length >= 2 && lines.every(isInfoRow)) {
      var rows = lines.map(renderInfoRow).filter(Boolean);
      if (rows.length === lines.length) {
        return '<div class="popup-rows">' + rows.join('') + '</div>';
      }
    }
    return '<p>' + inline(p) + '</p>';
  }

  // Strip everything before the editor marker; ignore HTML comments and # headings/quotes.
  function stripPreamble(md) {
    var marker = md.indexOf('POPUP CONTENT START');
    if (marker >= 0) {
      var nl = md.indexOf('\n', marker);
      if (nl >= 0) md = md.slice(nl + 1);
    }
    return md;
  }

  function parse(md) {
    md = stripPreamble(md);

    // Strip HTML comments (multi-line)
    md = md.replace(/<!--[\s\S]*?-->/g, '');

    // "none" / blank file → no popup
    if (md.trim().toLowerCase() === 'none' || md.trim() === '') return null;

    // Drop instruction lines (starting with > or #)
    var cleaned = md
      .split(/\r?\n/)
      .filter(function (l) { return !/^\s*>/.test(l) && !/^\s*#/.test(l); })
      .join('\n');

    var meta = {};
    var bodyLines = [];
    var lines = cleaned.split(/\r?\n/);
    var inMeta = true;
    var sawAnyMeta = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (inMeta) {
        // Skip leading blank lines until we either hit metadata or body
        if (line.trim() === '') {
          if (!sawAnyMeta) continue;       // still looking for first meta line
          inMeta = false;                  // blank after metadata → start body
          continue;
        }
        var m = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
        if (m) {
          meta[m[1].toLowerCase()] = m[2].trim();
          sawAnyMeta = true;
          continue;
        }
        // First non-meta, non-blank line — switch to body and re-process this line
        inMeta = false;
      }
      bodyLines.push(line);
    }

    // Group body lines into paragraphs by blank lines (preserve newlines INSIDE a paragraph)
    var paragraphs = [];
    var buf = [];
    bodyLines.forEach(function (l) {
      if (l.trim() === '') {
        if (buf.length) { paragraphs.push(buf.join('\n')); buf = []; }
      } else {
        buf.push(l.trim());
      }
    });
    if (buf.length) paragraphs.push(buf.join('\n'));

    var hasTitle = !!meta.title;
    var hasBody = paragraphs.length > 0;
    if (!hasTitle && !hasBody) return null;

    return {
      title: meta.title || '',
      icon: meta.icon || '📌',
      accent: (meta.accent || 'green').toLowerCase(),
      paragraphs: paragraphs,
      hash: hash((meta.title || '') + '|' + paragraphs.join('||'))
    };
  }

  function alreadyDismissed(h) {
    try {
      return localStorage.getItem(STORAGE_KEY) === h;
    } catch (_) { return false; }
  }

  function rememberDismissed(h) {
    try { localStorage.setItem(STORAGE_KEY, h); } catch (_) {}
  }

  function show(popup) {
    var accents = ['green', 'blue', 'gold', 'red'];
    var accent = accents.indexOf(popup.accent) >= 0 ? popup.accent : 'green';

    var bodyHtml = popup.paragraphs.map(renderParagraph).join('');

    var overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="popup-card accent-' + accent + '">' +
        '<div class="popup-header">' +
          '<div class="popup-icon">' + escape(popup.icon) + '</div>' +
          (popup.title
            ? '<h2 class="popup-title">' + escape(popup.title) + '</h2>'
            : '') +
          '<button type="button" class="popup-close" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="popup-body">' + bodyHtml + '</div>' +
        '<div class="popup-actions">' +
          '<button type="button" class="popup-dismiss">Got it</button>' +
        '</div>' +
      '</div>';

    function close() {
      rememberDismissed(popup.hash);
      overlay.remove();
      document.body.style.overflow = '';
    }

    overlay.querySelector('.popup-close').addEventListener('click', close);
    overlay.querySelector('.popup-dismiss').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        close();
      }
    });

    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch(POPUP_FILE, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (md) {
        var popup = parse(md);
        if (!popup) return;                 // empty popup file → silent
        if (alreadyDismissed(popup.hash)) return;
        show(popup);
      })
      .catch(function () { /* silent */ });
  });
})();
