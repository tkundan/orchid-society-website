/* Single source of truth for the Representative 2025-26 list.
   Add / edit / remove an entry, save, refresh — that's it.

   Fields:
     name       (required) — full display name. For pairs, use "A & B".
     dept       (required) — department / portfolio
     flat       (required) — "303" or "303 · 1809" for pairs/multiples; "TBD" if unknown
     photo      (optional) — filename in assets/representatives/, e.g. "kalpesh.jpg"
     photos     (optional) — array of filenames, used for pair cards (overlapping circles)
                              Provide either photo OR photos, not both.
                              If neither is provided, an initials placeholder is shown.
*/
window.REPRESENTATIVES = [
  {
    name: 'Aditya Samudra',
    dept: 'Housekeeping',
    flat: '2309',
    photo: 'aditya.jpg'
  },
  {
    name: 'Avinash Mane, Tejas Dalvee & Pankaj Rane',
    dept: 'Water Management',
    flat: '303 · 2807 · 1809',
    photos: ['avinash.jpg', 'tejas.jpg', 'pankaj.jpeg']
  },
  {
    name: 'Jitendra Naik & Sourabh Ghosh',
    dept: 'Lift',
    flat: '2802 · 1908',
    photos: ['jitendra.jpeg', 'sourabh.jpg']
  },
  {
    name: 'Kalpesh Mavlankar',
    dept: 'Security & PNG Gas Pipeline',
    flat: '3303',
    photo: 'kalpesh.jpg'
  },
  {
    name: 'Rakesh Patil',
    dept: 'Water Pipeline',
    flat: '2208',
    photo: 'rakesh.jpg'
  },
  {
    name: 'Sumit Tewari',
    dept: 'CCTV',
    flat: '3308',
    photo: 'sumit.jpeg'
  },
  {
    name: 'Tushar Chandar',
    dept: 'Fire Department',
    flat: '710',
    photo: 'tushar.jpeg'
  }
];

(function () {
  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return name
      .split(/\s*&\s*|\s+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase(); })
      .slice(0, 2)
      .join('');
  }

  function flatLabel(flat) {
    if (!flat) return '';
    return flat.indexOf('·') >= 0
      ? flat.split('·').map(function (f) { return 'Flat ' + f.trim(); }).join(' · ')
      : 'Flat ' + flat;
  }

  function photoMarkup(rep) {
    var alt = escape(rep.name);
    if (rep.photos && rep.photos.length > 1) {
      return '<div class="rep-photo-pair">' +
        rep.photos.map(function (f) {
          return '<img class="rep-photo" src="assets/representatives/' +
            escape(f) + '" alt="' + alt + '">';
        }).join('') +
        '</div>';
    }
    if (rep.photo) {
      return '<img class="rep-photo" src="assets/representatives/' +
        escape(rep.photo) + '" alt="' + alt + '">';
    }
    return '<div class="rep-photo-placeholder" aria-hidden="true">' +
      escape(initials(rep.name)) + '</div>';
  }

  function render(target) {
    var sorted = window.REPRESENTATIVES.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    target.innerHTML = sorted.map(function (rep) {
      return '<div class="rep-card">' +
        photoMarkup(rep) +
        '<div class="rep-body">' +
          '<p class="rep-name">' + escape(rep.name) + '</p>' +
          '<p class="rep-dept">' + escape(rep.dept) + '</p>' +
          '<p class="rep-flat">' + escape(flatLabel(rep.flat)) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.getElementById('repList');
    if (target) render(target);
  });
})();
