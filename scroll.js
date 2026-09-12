/* One-page scroll behaviour: section reveal, nav scroll-spy, sticky nav state.
 *
 * Everything here is progressive enhancement. The page is fully readable
 * without it -- the .reveal rules only hide content once this file has marked
 * the document as script-capable, so a failure to load leaves the page
 * visible rather than blank.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Marks the document as script-capable. Until this runs the .reveal opacity
  // rules are overridden by the html:not(.js) fallback, so no-JS visitors see
  // the content rather than an empty column.
  root.classList.add('js');

  /* ---------- Reveal on entry ------------------------------------- */
  // Direct children of each section animate in, staggered slightly so a
  // section arrives as a sequence rather than a single block.
  var targets = [];
  Array.prototype.forEach.call(
    document.querySelectorAll('.section'),
    function (section) {
      // The margin sticky notes are skipped. They carry their own rotate()
      // transform, and .reveal.is-in resets transform to none, which would
      // flatten them the moment they animated in. They are also absolutely
      // positioned, so they are not part of the section's reading sequence
      // and should not consume a stagger step.
      var kids = Array.prototype.filter.call(section.children, function (el) {
        return !el.classList.contains('note') &&
               !el.classList.contains('hero-name');
      });
      kids.forEach(function (child, i) {
        child.classList.add('reveal');
        child.style.setProperty('--reveal-delay', (Math.min(i, 4) * 0.06) + 's');
        targets.push(child);
      });
    }
  );

  if (reduced || !('IntersectionObserver' in window)) {
    // Nothing to animate: show everything immediately.
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);  // one-shot
      });
    }, {
      // Fire a little before the element reaches the fold so it is already
      // settling by the time it is properly in view.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0
    });
    targets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Nameplate entrance ---------------------------------- */
  // The name settles in letter by letter on load. Words are wrapped
  // separately so the name still breaks between words on a narrow screen --
  // per-character inline-blocks would otherwise let it break anywhere.
  var heroName = document.querySelector('.hero-name');
  if (heroName) {
    var full = heroName.textContent.trim();
    // Screen readers get the whole name from the label rather than spelling
    // out one span per letter.
    heroName.setAttribute('aria-label', full);

    if (reduced) {
      heroName.classList.add('is-lit');
    } else {
      var frag = document.createDocumentFragment();
      var i = 0;
      full.split(' ').forEach(function (word, w) {
        if (w > 0) {
          var gap = document.createElement('span');
          gap.className = 'hero-space';
          gap.textContent = '\u00a0';
          frag.appendChild(gap);
          i++;
        }
        var wordEl = document.createElement('span');
        wordEl.className = 'hero-word';
        word.split('').forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'hero-char';
          c.textContent = ch;
          c.style.setProperty('--char-delay', (i * 0.035) + 's');
          wordEl.appendChild(c);
          i++;
        });
        frag.appendChild(wordEl);
      });
      heroName.textContent = '';
      heroName.appendChild(frag);
      // Next frame, so the starting state is painted before it transitions.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          heroName.classList.add('is-lit');
        });
      });
    }
  }

  /* ---------- Nav scroll-spy -------------------------------------- */
  var links = Array.prototype.slice.call(
    document.querySelectorAll('.top-nav a[href^="#"]')
  );
  var sections = links
    .map(function (a) { return document.getElementById(a.hash.slice(1)); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      var on = a.hash === '#' + id;
      a.classList.toggle('active', on);
      // The active tab is the only orientation cue left now that there are no
      // per-page titles, so expose it to assistive tech, not just visually.
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  // A reading line sits ~30% down the viewport; the active section is the last
  // one that has started above it.
  //
  // This replaced an IntersectionObserver band, which got two cases wrong.
  // Where two sections both straddled the band the earlier one always won, so
  // an anchor jump could land on a section while the previous tab stayed lit.
  // And the final section never became active at all: once the page is
  // scrolled to the bottom it stops moving, so a short last section never
  // reaches the line -- hence the explicit bottom-of-page case below.
  function topOf(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function currentSection() {
    var doc = document.documentElement;
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    if (atBottom) return sections[sections.length - 1];

    var line = window.scrollY + window.innerHeight * 0.3;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (topOf(sections[i]) <= line) current = sections[i];
    }
    return current;
  }

  if (sections.length) {
    var ticking = false;
    var syncSpy = function () {
      ticking = false;
      var s = currentSection();
      if (s) setActive(s.id);
    };
    var onSpyScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncSpy);
    };
    syncSpy();
    window.addEventListener('scroll', onSpyScroll, { passive: true });
    window.addEventListener('resize', onSpyScroll, { passive: true });
  }

  // Clicking a tab should move keyboard focus to that section, not just the
  // viewport -- otherwise the next Tab press resumes from the nav.
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      // After the smooth scroll settles, focus without scrolling again.
      window.setTimeout(function () {
        target.focus({ preventScroll: true });
      }, reduced ? 0 : 500);
    });
  });

  /* ---------- Sticky nav gains its edge once scrolled ------------- */
  var nav = document.querySelector('.top-nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
