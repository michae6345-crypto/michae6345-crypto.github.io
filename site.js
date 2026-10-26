(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme toggle
  var toggle = document.getElementById('theme-toggle');
  function labelToggle() {
    if (toggle) toggle.setAttribute('aria-label', 'Switch to ' + (root.classList.contains('dark') ? 'light' : 'dark') + ' mode');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      root.classList.toggle('dark');
      try { localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {}
      labelToggle();
    });
    labelToggle();
  }

  // animated folds
  function setFold(details, opening) {
    var summary = details.querySelector('summary');
    var hint = summary.querySelector('span');
    summary.setAttribute('aria-expanded', String(opening));
    if (hint) hint.textContent = opening ? 'click to close' : 'click to expand';
    if (reduceMotion || !details.animate) {
      details.open = opening;
      return;
    }
    var start = details.getBoundingClientRect().height;
    if (opening) details.open = true;
    var end = opening ? details.scrollHeight : summary.getBoundingClientRect().height;
    if (details._anim) details._anim.cancel();
    var anim = details.animate(
      [{ height: start + 'px', overflow: 'hidden' }, { height: end + 'px', overflow: 'hidden' }],
      { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' }
    );
    details._anim = anim;
    anim.onfinish = function () {
      if (details._anim !== anim) return;
      if (!opening) details.open = false;
      details._anim = null;
    };
    return anim;
  }
  document.querySelectorAll('details.fold').forEach(function (details) {
    var summary = details.querySelector('summary');
    summary.setAttribute('aria-expanded', String(details.open));
    summary.addEventListener('click', function (event) {
      event.preventDefault();
      setFold(details, !details.open);
    });
  });

  // in-page links that point at a fold open it first
  document.querySelectorAll('a[data-open-fold]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = document.getElementById(link.getAttribute('data-open-fold'));
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', '#' + target.id);
      var anim = target.open ? null : setFold(target, true);
      var go = function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      if (anim && anim.finished) anim.finished.then(go).catch(function () {}); else go();
    });
  });
})();
