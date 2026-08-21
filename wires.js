/* Decorative hanging wires.
 *
 * Injected from one file rather than pasted into every page so the markup
 * has a single source of truth.
 *
 * These dangle from the top edge rather than swagging between two anchors,
 * so they are not catenaries (y = a·cosh(x/a), which describes a cable
 * supported at BOTH ends). A free-hanging cable is near-vertical with a
 * slight lateral drift, so each wire is a cubic bezier with a small
 * horizontal offset and a weighted tip.
 *
 * Purely decorative: aria-hidden and pointer-events:none, so it is skipped
 * by screen readers and never intercepts clicks.
 */
(function () {
  function build() {
    if (document.querySelector('.wires')) return;

    var wrap = document.createElement('div');
    wrap.className = 'wires';
    wrap.setAttribute('aria-hidden', 'true');

    // Each wire: [path, stroke, width, sway duration (s), delay (s), tip radius]
    var wires = [
      ['M 60 0 C 60 90, 52 150, 55 236',  '#d0d0d0', 1.5, 6.5,  0,    3.5],
      ['M 78 0 C 78 120, 88 210, 84 328', '#bcbcbc', 2,   8.2, -1.4,  4.5],
      ['M 44 0 C 44 70, 34 130, 38 182',  '#e0e0e0', 1,   5.4, -0.7,  2.5]
    ];

    var svg = '<svg viewBox="0 0 120 360" width="120" height="360" '
            + 'fill="none" xmlns="http://www.w3.org/2000/svg">';

    wires.forEach(function (w, i) {
      var d = w[0], stroke = w[1], sw = w[2], dur = w[3], delay = w[4], r = w[5];
      // Tip coordinates are the bezier's end point, parsed from the path so
      // the weight can never drift away from the wire it belongs to.
      var end = d.trim().split(/[\s,]+/).slice(-2);
      svg += '<g class="wire" style="--dur:' + dur + 's;--delay:' + delay + 's">'
           +   '<path d="' + d + '" stroke="' + stroke + '" stroke-width="' + sw
           +     '" stroke-linecap="round"/>'
           +   '<circle cx="' + end[0] + '" cy="' + end[1] + '" r="' + r
           +     '" fill="' + stroke + '"/>'
           + '</g>';
    });
    svg += '</svg>';

    wrap.innerHTML = svg;
    document.body.insertBefore(wrap, document.body.firstChild);
    retractOnScroll(wrap);
  }

  /* Wires reel in as the page scrolls, as though pulled up over the top
   * edge. Each path is trimmed with stroke-dasharray: the visible run is
   * the first (1 - progress) of its length, so the free end travels
   * upward while the anchored top stays put. The weighted tip is moved to
   * the new endpoint via getPointAtLength so it always sits on the wire.
   *
   * Scroll events fire far more often than frames, so the handler only
   * flags dirty and the real work happens once per rAF.
   */
  function retractOnScroll(wrap) {
    var groups = [].slice.call(wrap.querySelectorAll('.wire')).map(function (g) {
      var path = g.querySelector('path');
      return { path: path, tip: g.querySelector('circle'), len: path.getTotalLength() };
    });
    if (!groups.length) return;

    var ticking = false;
    var lastP = -1;

    function apply() {
      ticking = false;
      // Fully retracted after 70% of a viewport height of scrolling.
      var span = Math.max(1, window.innerHeight * 0.7);
      var p = Math.min(1, Math.max(0, window.pageYOffset / span));
      if (p === lastP) return;
      lastP = p;

      groups.forEach(function (g) {
        var shown = g.len * (1 - p);
        // Second value pads the gap so the remainder never redraws.
        g.path.setAttribute('stroke-dasharray', shown + ' ' + (g.len + 1));
        var pt = g.path.getPointAtLength(shown);
        g.tip.setAttribute('cx', pt.x);
        g.tip.setAttribute('cy', pt.y);
        // Hide the bead once the wire is essentially gone, so a dot is
        // not left stranded at the anchor.
        g.tip.style.opacity = shown < 4 ? 0 : 1;
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    apply(); // honour a restored scroll position on load
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
