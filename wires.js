/* Decorative hanging wires.
 *
 * Injected from one file rather than pasted into every page so the markup
 * has a single source of truth.
 *
 * These dangle from the top edge rather than swagging between two anchors,
 * so they are not catenaries (y = a*cosh(x/a), which describes a cable
 * supported at BOTH ends). A free-hanging cable is near-vertical with a
 * slight lateral drift, so each wire is a cubic bezier with a weighted tip.
 *
 * Purely decorative: aria-hidden and pointer-events:none, so it is skipped
 * by screen readers and never intercepts clicks.
 */
(function () {
  // Wire sets, keyed by page. Each page gets its own anchor position and
  // its own arrangement so the decoration does not read as one static
  // frame pinned to every screen.
  // anchor = percentage of viewport width the bundle hangs from.
  // wire   = [path, stroke, width, sway duration (s), delay (s), tip radius]
  var LAYOUTS = {
    'index.html': {
      anchor: '78%',
      wires: [
        ['M 62 0 C 62 100, 54 170, 57 268', '#c9c9c9', 1.5, 6.8, 0, 3.5],
        ['M 84 0 C 84 130, 94 230, 90 360', '#b4b4b4', 2, 8.6, -1.6, 4.5],
        ['M 42 0 C 42 60, 32 120, 36 160', '#dcdcdc', 1, 5.2, -0.6, 2.5]
      ]
    },
    'projects.html': {
      anchor: '72%',
      wires: [
        ['M 48 0 C 48 110, 60 190, 55 300', '#bdbdbd', 2, 7.4, -0.4, 4],
        ['M 74 0 C 74 80, 66 140, 70 214', '#d2d2d2', 1.5, 6.0, -1.9, 3],
        ['M 96 0 C 96 150, 88 260, 92 392', '#c6c6c6', 1.5, 9.1, -3.2, 3.5]
      ]
    },
    'connect.html': {
      anchor: '84%',
      wires: [
        ['M 58 0 C 58 140, 70 240, 64 336', '#bfbfbf', 2, 8.0, -2.2, 4.5],
        ['M 88 0 C 88 70, 80 128, 84 186', '#d6d6d6', 1, 5.8, 0, 2.5]
      ]
    },
    // Detail pages share a shape but shift horizontally per project so
    // consecutive pages do not look identical.
    '_detail': {
      anchor: '80%',
      wires: [
        ['M 52 0 C 52 90, 44 160, 48 246', '#cdcdcd', 1.5, 6.4, -0.9, 3.5],
        ['M 82 0 C 82 120, 92 210, 88 322', '#bababa', 2, 8.8, -2.6, 4]
      ]
    }
  };

  var DETAIL_ANCHOR = {
    'project-1.html': '80%',
    'project-2.html': '73%',
    'project-3.html': '86%',
    'project-5.html': '76%',
    'project-6.html': '83%'
  };

  function layoutForPage() {
    var file = location.pathname.split('/').pop() || 'index.html';
    if (LAYOUTS[file]) return LAYOUTS[file];
    return {
      anchor: DETAIL_ANCHOR[file] || LAYOUTS._detail.anchor,
      wires: LAYOUTS._detail.wires
    };
  }

  function build() {
    if (document.querySelector('.wires')) return;

    var layout = layoutForPage();
    var wrap = document.createElement('div');
    wrap.className = 'wires';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.left = layout.anchor;

    var svg = '<svg viewBox="0 0 130 400" width="130" height="400" '
            + 'fill="none" xmlns="http://www.w3.org/2000/svg">';

    layout.wires.forEach(function (w) {
      var d = w[0], stroke = w[1], sw = w[2], dur = w[3], delay = w[4], r = w[5];
      // Tip coordinates come from the path's end point, parsed from the
      // path itself so the weight can never drift off its wire.
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
   * edge. Each path is trimmed with stroke-dasharray so the visible run is
   * the first (1 - progress) of its length: the free end travels upward
   * while the anchored top stays put.
   *
   * Two things keep this smooth:
   *
   * 1. getPointAtLength makes the browser recompute path geometry, so
   *    calling it every frame for every wire is what makes scroll-driven
   *    SVG trimming feel heavy. Each path is sampled ONCE into a lookup
   *    table at startup; per frame is then an array read plus a lerp.
   *
   * 2. Scroll events arrive at irregular intervals and bunch up, so
   *    binding geometry straight to scrollY looks steppy. A rAF loop eases
   *    the drawn value toward the scroll target instead, decoupling
   *    smoothness from event frequency. The loop parks itself once it
   *    settles, so it costs nothing at rest.
   */
  var SAMPLES = 160;

  function retractOnScroll(wrap) {
    var groups = [].slice.call(wrap.querySelectorAll('.wire')).map(function (g) {
      var path = g.querySelector('path');
      var len = path.getTotalLength();
      var pts = new Float32Array((SAMPLES + 1) * 2);
      for (var i = 0; i <= SAMPLES; i++) {
        var pt = path.getPointAtLength(len * (i / SAMPLES));
        pts[i * 2] = pt.x;
        pts[i * 2 + 1] = pt.y;
      }
      return { path: path, tip: g.querySelector('circle'), len: len, pts: pts, last: -1 };
    });
    if (!groups.length) return;

    var target = 0;   // where the scroll position says we should be
    var current = 0;  // what is actually drawn, chasing target
    var running = false;

    function readTarget() {
      // Fully retracted after 70% of a viewport height of scrolling.
      var span = Math.max(1, window.innerHeight * 0.7);
      target = Math.min(1, Math.max(0, window.pageYOffset / span));
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    function draw(p) {
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        var shown = g.len * (1 - p);
        if (Math.abs(shown - g.last) < 0.15) continue; // sub-pixel, skip write
        g.last = shown;

        g.path.setAttribute('stroke-dasharray', shown + ' ' + (g.len + 1));

        // Interpolate the tip from the sample table rather than asking the
        // browser to re-measure the path.
        var f = (1 - p) * SAMPLES;
        var i0 = f | 0;
        if (i0 >= SAMPLES) i0 = SAMPLES - 1;
        var t = f - i0;
        var x = g.pts[i0 * 2] + (g.pts[i0 * 2 + 2] - g.pts[i0 * 2]) * t;
        var y = g.pts[i0 * 2 + 1] + (g.pts[i0 * 2 + 3] - g.pts[i0 * 2 + 1]) * t;
        g.tip.setAttribute('cx', x);
        g.tip.setAttribute('cy', y);
        g.tip.style.opacity = shown < 4 ? 0 : 1;
      }
    }

    function frame() {
      // Exponential ease toward the target: fast enough to feel attached
      // to the scroll, damped enough to hide irregular event timing.
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.0006) current = target;
      draw(current);
      if (current !== target) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    window.addEventListener('scroll', readTarget, { passive: true });
    window.addEventListener('resize', readTarget, { passive: true });

    // Honour a restored scroll position without sweeping in on load.
    readTarget();
    current = target;
    draw(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
