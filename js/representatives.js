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
    name: 'Avinash Mane & Tejas Dalvee',
    dept: 'Water Management',
    flat: '303 · 2807 ',
    photos: ['avinash.jpg', 'tejas.jpg']
  },
  {
    name: 'Jitendra Naik, Pankaj Rane & Sourabh Ghosh',
    dept: 'Lift',
    flat: '2802 ·1809 · 1908',
    photos: ['jitendra.jpeg', 'pankaj.jpeg', 'sourabh.jpg']
  },
  {
    name: 'Kalpesh Mavlankar',
    dept: 'Security & PNG Gas Pipeline',
    flat: '3303',
    photo: 'kalpesh.jpg'
  },
  {
    name: 'Onkar Suryavanshi',
    dept: 'Water Pipeline & Sewage',
    flat: '2208',
    photo: 'onkar.jpg'
  },
  {
    name: 'Sumit Tewari',
    dept: 'CCTV',
    flat: '3308',
    photo: 'sumit.jpeg'
  },
  {
    name: 'Vaibhav Kulkarni, Hasmukh Chavda & Shailesh Agrawal',
    dept: 'Two-Wheeler Parking Management Team',
    flat: '2707 ·2911 · 0208',
    photos: ['vaibhav.jpg', 'hashmukh.jpg', 'shailesh.jpg']
  },
  {
    name: 'Tushar Chandar',
    dept: 'Fire Department',
    flat: '710',
    photo: 'tushar.jpeg'
  }
];

/* Floor Representatives — one (or more) resident per floor, no department.
   Fields:
     name   (required) — full display name
     floor  (required) — integer floor number (e.g. 21 for "21st floor")
     flat   (optional) — flat number, e.g. "2103"
     photo  (optional) — filename in assets/representatives/
                          If absent, an initials placeholder is shown.

   Sample data below — replace with real names when you have them. */
window.FLOOR_REPRESENTATIVES = [
  { name: 'Vivek Chhabra',            floor: 1,  flat: '103', photo: 'vivek.jpeg' },
  { name: 'Shailesh Agrawal',         floor: 2,  flat: '208', photo: 'shailesh.jpg' },
  { name: 'Avinashi Mane',            floor: 3,  flat: '305', photo: 'avinash.jpg' },
  { name: 'Sachin Patil',             floor: 6,  flat: '603', photo: 'chairman.jpg' },
  { name: 'Abhishek Mane',            floor: 7,  flat: '704' },
  { name: 'Tushar',                   floor: 7,  flat: '710', photo: 'tushar.jpeg' },
  { name: 'Santosh Pendurkar',        floor: 8,  flat: '804' },
  { name: 'Deepak Phalke',            floor: 9,  flat: '911', photo: 'deepak.jpg' },
  { name: 'Kundan Thakur',            floor: 11, flat: '1108', photo: 'kundan.jpg' },
  { name: 'Hitesh Jayantilal Jain',   floor: 12, flat: '1202', photo: 'hitesh.jpg' },
  { name: 'Kartik Negandhi',          floor: 13, flat: '' },
  { name: 'Swapnil Mokal',            floor: 13, flat: '1303' },
  { name: 'Gautam',                   floor: 17, flat: '', photo: 'gautam.jpg' },
  { name: 'Piya',                     floor: 17, flat: '1702-03' },
  { name: 'Mukund Raut',              floor: 18, flat: '1810', photo: 'mukund.jpg' },
  { name: 'Vinod Patil',              floor: 18, flat: '' },
  { name: 'Onkar Suryavanshi',        floor: 19, flat: '1904', photo: 'onkar.jpg' },
  { name: 'Vishal Sonavane',          floor: 20, flat: '' },
  { name: 'Nilesh Hadkar',            floor: 20, flat: '' },
  { name: 'Mangesh Shirke',           floor: 21, flat: '2109', photo: 'mangesh.jpg' },
  { name: 'Saikat Maity',             floor: 21, flat: '2108' },
  { name: 'Rakesh Patil',             floor: 22, flat: '2208', photo: 'rakesh.jpg' },
  { name: 'Aditya Samudra',           floor: 23, flat: '2309', photo: 'aditya.jpg' },
  { name: 'Kedar Gunturkar',          floor: 24, flat: '2402' },
  { name: 'Mandar Khatkhate',         floor: 25, flat: '2502-03' },
  { name: 'Purva Kakade',             floor: 26, flat: '2607' },
  { name: 'Vaibhav Kulkarni',         floor: 27, flat: '2707', photo: 'vaibhav.jpg' },
  { name: 'Jitendra Naik',            floor: 28, flat: '2802', photo: 'jitendra.jpeg' },
  { name: 'Hasmukh Chavda',           floor: 29, flat: '', photo: 'hashmukh.jpg' },
  { name: 'Shekhar Khairnar',         floor: 30, flat: '3002' },
  { name: 'Arjun Gajra',              floor: 32, flat: '' },
  { name: 'Kalpesh',                  floor: 33, flat: '3303', photo: 'kalpesh.jpg' },
  { name: 'Sumit',                    floor: 33, flat: '3308', photo: 'sumit.jpeg' },
  { name: 'Khushali Bayani',          floor: 34, flat: '3410', photo: 'khushali.jpeg' },
  { name: 'Mithun Pednekar',          floor: 35, flat: '3505' },
  { name: 'Meghna Pednekar',          floor: 35, flat: '3505' }
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

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

  function renderFloors(target) {
    var list = window.FLOOR_REPRESENTATIVES || [];
    var sorted = list.slice().sort(function (a, b) {
      return (a.floor - b.floor) || a.name.localeCompare(b.name);
    });
    target.innerHTML = sorted.map(function (rep) {
      var flatLine = rep.flat
        ? '<p class="rep-flat">' + escape(flatLabel(rep.flat)) + '</p>'
        : '';
      return '<div class="rep-card">' +
        photoMarkup(rep) +
        '<div class="rep-body">' +
          '<p class="rep-name">' + escape(rep.name) + '</p>' +
          '<p class="rep-dept">' + escape(ordinal(rep.floor)) + ' Floor</p>' +
          flatLine +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.getElementById('repList');
    if (target) render(target);
    var floorTarget = document.getElementById('floorRepList');
    if (floorTarget) renderFloors(floorTarget);
  });
})();
