/* Renders content/notices.md into the Notice Board.
   Editors only touch the Markdown file — this script handles formatting.

   Supported per-notice syntax:
     ## Title
     key: value          (optional metadata: urgent, icon, deadline, …)
     key: value
                         (one blank line)
     Body paragraph 1.

     Body paragraph 2 with **bold** and [a link](https://example.com).

     > [Button label](https://example.com)
     > [Another button](mailto:foo@bar.com)
*/
(function () {
  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Inline formatting: **bold**, *italic*, [text](url)
  function inline(text) {
    var s = escape(text);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
      var safeHref = href.replace(/"/g, '&quot;');
      var external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + safeHref + '"' + external + '>' + label + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  }

  function buttonFromLine(line) {
    var m = line.match(/^>\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
    if (!m) return null;
    var label = escape(m[1]);
    var href = m[2].replace(/"/g, '&quot;');
    var external = /^https?:/i.test(m[2]) ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + href + '"' + external + ' class="btn">' + label + '</a>';
  }

  // Splits the document on `## ` headings; everything before the first heading is ignored.
  function splitNotices(md) {
    var blocks = [];
    var lines = md.split(/\r?\n/);
    var current = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading) {
        if (current) blocks.push(current);
        current = { title: heading[1], lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) blocks.push(current);
    return blocks;
  }

  function parseNotice(block) {
    var meta = {};
    var bodyLines = [];
    var inMeta = true;

    for (var i = 0; i < block.lines.length; i++) {
      var line = block.lines[i];
      if (inMeta) {
        if (line.trim() === '') { inMeta = false; continue; }
        var m = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
        if (m) { meta[m[1].toLowerCase()] = m[2].trim(); continue; }
        // First non-meta line — fall through into body
        inMeta = false;
      }
      bodyLines.push(line);
    }

    // Separate trailing button lines (consecutive `> [..](..)`) from the rest
    var buttons = [];
    while (bodyLines.length) {
      var last = bodyLines[bodyLines.length - 1].trim();
      if (last === '') { bodyLines.pop(); continue; }
      var btn = buttonFromLine(last);
      if (!btn) break;
      buttons.unshift(btn);
      bodyLines.pop();
    }

    // Group remaining lines into paragraphs (blank-line separated)
    var paragraphs = [];
    var buf = [];
    bodyLines.forEach(function (l) {
      if (l.trim() === '') {
        if (buf.length) { paragraphs.push(buf.join(' ')); buf = []; }
      } else {
        buf.push(l.trim());
      }
    });
    if (buf.length) paragraphs.push(buf.join(' '));

    return {
      title: block.title,
      meta: meta,
      paragraphs: paragraphs,
      buttons: buttons
    };
  }

  function renderNotice(n) {
    var isUrgent = (n.meta.urgent || '').toLowerCase() === 'true';
    var icon = n.meta.icon || (isUrgent ? '⚠️' : '📌');

    if (isUrgent) {
      var deadline = n.meta.deadline
        ? ' <span class="deadline-badge">' + escape(n.meta.deadline) + '</span>'
        : '';
      var bodyHtml = n.paragraphs.map(function (p) {
        return '<p>' + inline(p) + '</p>';
      }).join('');
      var btnHtml = n.buttons.length
        ? '<p style="margin-top:12px;">' + n.buttons.join(' ') + '</p>'
        : '';
      return '<div class="urgent-notice">' +
        '<div class="urgent-icon">' + escape(icon) + '</div>' +
        '<div>' +
          '<h4>' + escape(n.title) + deadline + '</h4>' +
          bodyHtml + btnHtml +
        '</div>' +
      '</div>';
    }

    var paraHtml = n.paragraphs.map(function (p) {
      return '<p>' + inline(p) + '</p>';
    }).join('');
    var btnHtml = n.buttons.map(function (b) {
      return b;
    }).join('<br><br>');

    return '<div class="card">' +
      '<div class="card-icon" style="font-size:1.2rem;">' + escape(icon) + '</div>' +
      '<h3>' + escape(n.title) + '</h3>' +
      paraHtml +
      (btnHtml ? '<div style="margin-top:14px;">' + btnHtml + '</div>' : '') +
    '</div>';
  }

  // Parse content/popup.md into a notice-shaped object so it can appear in the list.
  function parsePopupAsNotice(md) {
    if (!md) return null;
    // Strip preamble + comments
    var marker = md.indexOf('POPUP CONTENT START');
    if (marker >= 0) {
      var nl = md.indexOf('\n', marker);
      if (nl >= 0) md = md.slice(nl + 1);
    }
    md = md.replace(/<!--[\s\S]*?-->/g, '');
    if (md.trim().toLowerCase() === 'none' || md.trim() === '') return null;

    var cleaned = md.split(/\r?\n/)
      .filter(function (l) { return !/^\s*>/.test(l) && !/^\s*#/.test(l); })
      .join('\n');

    var meta = {};
    var bodyLines = [];
    var inMeta = true;
    var sawAny = false;
    cleaned.split(/\r?\n/).forEach(function (line) {
      if (inMeta) {
        if (line.trim() === '') {
          if (sawAny) inMeta = false;
          return;
        }
        var m = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
        if (m) { meta[m[1].toLowerCase()] = m[2].trim(); sawAny = true; return; }
        inMeta = false;
      }
      bodyLines.push(line);
    });

    if (!meta.title && !bodyLines.length) return null;

    // Group into paragraphs
    var paragraphs = [];
    var buf = [];
    bodyLines.forEach(function (l) {
      if (l.trim() === '') {
        if (buf.length) { paragraphs.push(buf.join(' ')); buf = []; }
      } else {
        buf.push(l.trim());
      }
    });
    if (buf.length) paragraphs.push(buf.join(' '));

    // Treat red/gold accents as urgent so they sit in the gold callout band
    var urgentByAccent = ['red', 'gold'].indexOf((meta.accent || '').toLowerCase()) >= 0;

    return {
      title: meta.title || 'Latest Update',
      meta: {
        icon: meta.icon || '📢',
        urgent: urgentByAccent ? 'true' : '',
        deadline: meta.deadline || ''
      },
      paragraphs: paragraphs,
      buttons: []
    };
  }

  function render(md, popupMd, urgentTarget, listTarget) {
    var notices = splitNotices(md).map(parseNotice);
    var popupNotice = parsePopupAsNotice(popupMd);

    var urgent = notices.filter(function (n) { return (n.meta.urgent || '').toLowerCase() === 'true'; });
    var rest   = notices.filter(function (n) { return (n.meta.urgent || '').toLowerCase() !== 'true'; });

    // Slot the popup notice in front of its peer group so residents see it first.
    if (popupNotice) {
      if ((popupNotice.meta.urgent || '').toLowerCase() === 'true') {
        urgent.unshift(popupNotice);
      } else {
        rest.unshift(popupNotice);
      }
    }

    if (urgentTarget) urgentTarget.innerHTML = urgent.map(renderNotice).join('');
    if (listTarget)   listTarget.innerHTML   = rest.map(renderNotice).join('');
  }

  function fetchText(path) {
    return fetch(path, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .catch(function () { return ''; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var listTarget = document.getElementById('noticeList');
    var urgentTarget = document.getElementById('urgentNotices');
    if (!listTarget && !urgentTarget) return;

    Promise.all([
      fetchText('content/notices.md'),
      fetchText('content/popup.md')
    ]).then(function (results) {
      render(results[0], results[1], urgentTarget, listTarget);
    });
  });
})();
