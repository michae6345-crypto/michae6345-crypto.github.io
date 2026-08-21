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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
