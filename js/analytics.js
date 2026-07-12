/* Load GoatCounter tracker.
   Placed here (not in partials/footer.html) because include.js injects
   partials via outerHTML, and browsers do not execute <script> tags
   inserted that way. Loading it as a normal external script ensures
   the tracker actually runs. */
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://orchid.goatcounter.com/count');
  document.head.appendChild(s);
})();
