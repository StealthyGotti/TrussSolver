// Editor viewport in SVG coordinates. All gestures act on the same transform as node picking.
const BoardNavigation = (() => {
  function point(svg, event) {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  function attach(svg, currentView, handActive, repaint) {
    const pointers = new Map();
    function transform(from, to, factor) {
      const view = currentView();
      const scale = Math.max(view.fitScale / 32, Math.min(view.fitScale * 32, view.scale * factor));
      const ratio = scale / view.scale;
      view.ox = to.x - (from.x - view.ox) * ratio;
      view.oy = to.y - (from.y - view.oy) * ratio;
      view.scale = scale;
      repaint();
    }

    function gesture() {
      const [a, b] = pointers.values();
      if (!b) return {center: a, distance: 0};
      return {
        center: {x: (a.x+b.x)/2, y: (a.y+b.y)/2},
        distance: Math.hypot(a.x-b.x, a.y-b.y)
      };
    }

    svg.addEventListener('pointerdown', event => {
      if (!handActive() || event.button !== 0 || pointers.size >= 2) return;
      event.preventDefault();
      pointers.set(event.pointerId, point(svg, event));
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      const before = gesture();
      pointers.set(event.pointerId, point(svg, event));
      const after = gesture();
      const factor = before.distance > 1 && after.distance > 1 ? after.distance / before.distance : 1;
      transform(before.center, after.center, factor);
    });
    function finish(event) {
      pointers.delete(event.pointerId);
      if (!pointers.size) svg.classList.remove('dragging');
    }
    svg.addEventListener('pointerup', finish);
    svg.addEventListener('pointercancel', finish);
    svg.addEventListener('lostpointercapture', event => {
      if (event.target === svg) finish(event);
    });
    svg.addEventListener('wheel', event => {
      if (!event.deltaY) return;
      event.preventDefault();
      const anchor = point(svg, event);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? currentView().height : 1;
      const power = Math.max(-1, Math.min(1, -event.deltaY * unit * .002));
      transform(anchor, anchor, Math.exp(power));
    }, {passive: false});

    return {
      zoom(factor) {
        const {width, height} = currentView();
        const center = {x: width/2, y: height/2};
        transform(center, center, factor);
      }
    };
  }
  return {point, attach};
})();
if (typeof module !== 'undefined') module.exports = BoardNavigation;
