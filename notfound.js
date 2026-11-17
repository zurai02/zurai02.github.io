/* notfound.js — logic for 404.html */
(function () {
  'use strict';

  var REDIRECTS = {
    'github': 'https://github.com/zurai02',
    'repositories': 'https://github.com/zurai02?tab=repositories',
    'repos': 'https://github.com/zurai02?tab=repositories',
    'stars': 'https://github.com/zurai02?tab=stars',
    'portfolio': 'https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442',
    'devforum': 'https://devforum.roblox.com/u/zurai02',
    'discord': 'https://discord.com/users/1460949263650652200'
  };

  var CFG = { user: 'zurai02', redirectTimeout: 3500, fontWait: 400 };
  function $(id) { return document.getElementById(id); }

  function initNotFound() {
    var card = $('nf-card');
    var title = $('nf-title');
    var msg = $('nf-msg');
    var badge = $('nf-badge-text');
    if (!card || !title || !msg || !badge) return;

    var user = CFG.user;
    var segments = location.pathname.split('/').filter(Boolean);
    var repoName = segments[0] || '';
    var key = repoName.toLowerCase();

    // Check custom shortlink redirects first
    if (REDIRECTS[key]) {
      location.replace(REDIRECTS[key]);
      return;
    }

    function revealCard() {
      card.hidden = false;
    }

    function showError(errTitle, tag, buildMsg) {
      title.textContent = errTitle;
      badge.textContent = tag;
      msg.textContent = '';
      buildMsg(msg);
      document.title = errTitle + ' — ' + user;
      revealCard();
    }

    // Only single-segment, valid-looking names can be repos
    if (
      segments.length !== 1 ||
      !/^[A-Za-z0-9_.-]+$/.test(repoName) ||
      repoName === '.' || repoName === '..'
    ) {
      showError('Page Not Found', '404 // INVALID_PATH', function (el) {
        el.textContent = 'There is no repository or page at this path.';
      });
      return;
    }

    var targetUrl = 'https://github.com/' + user + '/' + encodeURIComponent(repoName);
    var resolved = false;

    function redirect() {
      if (resolved) return;
      resolved = true;
      location.replace(targetUrl);
    }

    var timer = setTimeout(redirect, CFG.redirectTimeout);

    fetch('https://api.github.com/repos/' + user + '/' + encodeURIComponent(repoName))
      .then(function (res) {
        if (res.status === 404) {
          clearTimeout(timer);
          resolved = true;
          showError('Repository Not Found', '404 // REPO_NOT_FOUND', function (el) {
            var code = document.createElement('span');
            code.className = 'nf-repo';
            code.textContent = repoName;
            el.append('No public repository matching ', code, ' was found on @' + user + '.');
          });
          return null;
        }
        if (!res.ok) { redirect(); return null; }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        clearTimeout(timer);
        redirect();
      })
      .catch(redirect);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNotFound);
  else initNotFound();
})();
