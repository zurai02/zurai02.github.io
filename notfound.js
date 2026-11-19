/* notfound.js — clean logic for 404.html */
(function () {
  'use strict';

  function initNotFound() {
    var pathEl = document.getElementById('nf-path');
    if (pathEl) {
      var p = window.location.pathname || '';
      pathEl.textContent = p.length > 0 ? p : 'requested path';
    }

    var glow = document.getElementById('cursor-glow');
    if (glow) {
      window.addEventListener('pointermove', function (e) {
        glow.style.transform = 'translate(' + (e.clientX - 150) + 'px, ' + (e.clientY - 150) + 'px)';
        glow.style.opacity = '1';
      }, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotFound);
  } else {
    initNotFound();
  }
})();
