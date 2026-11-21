const Draft = (() => {
  const ink = '#294448', green = '#007a68', rust = '#b85b2a', faint = '#8caaa0';
  const esc = text => String(text).replace(
      /[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'}[c]));
  const line = (x, y, u, v, stroke = ink, w = 1.5, extra = '') =>
      `<line x1="${x}" y1="${y}" x2="${u}" y2="${v}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const path = (d, stroke = ink, fill = 'none', w = 1.5, extra = '') => `<path d="${d}" stroke="${
      stroke}" fill="${fill}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const circle = (x, y, r, stroke, fill, w = 1.5) =>
      `<circle cx="${x}" cy="${y}" r="${r}" stroke="${stroke}" fill="${fill}" stroke-width="${w}"/>`;
  const label = (x, y, txt, color = ink, size = 12, anchor = 'middle') => `<text x="${x}" y="${
      y}" text-anchor="${anchor}" fill="${color}" font-family="ui-monospace,Menlo,monospace" font-size="${
      size}" font-weight="550" paint-order="stroke" stroke="#fafcf9" stroke-width="3" stroke-linejoin="round">${
      esc(txt)}</text>`;
  function arrow(x, y, u, v, color, w = 1.6) {
    const ang = Math.atan2(v - y, u - x), len = Math.min(6, Math.hypot(u - x, v - y) / 2),
          a = Math.cos(ang) * len, b = Math.sin(ang) * len;
    return line(x, y, u, v, color, w) +
        path(`M ${u - a - b * .47} ${v - b + a * .47} L ${u} ${v} ${u - a + b * .47} ${v - b - a * .47}`,
               color, 'none', w);
  }
  function viewport(nodes, width, height) {
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    if (!nodes.length) {
      xs.push(-2, 4);
      ys.push(-1, 3);
    }
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const scale = Math.min((width - 130) / (x1 - x0 || 3), (height - 132) / (y1 - y0 || 2));
    return {
      width,
      height,
      scale,
      ox: width / 2 - (x0 + x1) * scale / 2,
      oy: height / 2 + (y0 + y1) * scale / 2 + 5
    };
  }
  const pos = (n, v) => [v.ox + n.x * v.scale, v.oy - n.y * v.scale];
  function support(x, y, axes) {
    if (!axes.length)
      return '';
    let sym = '';
    if (axes.includes(2) && axes.length === 3) {
      sym = line(-14, 4, 14, 4, green, 2);
      for (let a = -12; a <= 14; a += 5)
        sym += line(a, 5, a - 5, 11, green, 1);
    } else if (!axes.includes(2)) {
      sym = path('M 0 2 L -10 15 L 10 15 Z', green, '#e1f1e9');
      if (axes.length === 1)
        sym += circle(-6, 18, 2, green, 'white', 1) + circle(6, 18, 2, green, 'white', 1) +
            line(-13, 21, 13, 21, green, 1);
      else
        sym += line(-13, 18, 13, 18, green, 1);
    } else
      return label(x, y + 24, axes.map(d => ['H', 'V', 'C'][d]).join('+'), green, 11);
    return `<g transform="translate(${x} ${y}) rotate(${axes.length === 1 && axes[0] === 0 ? -90 : 0})">${
        sym}</g>`;
  }
  function pointLoad(x, y, fx, fy, caption, outgoing=false) {
    const norm = Math.hypot(fx, fy);
    if (!norm)
      return '';
    const c = fx / norm, s = -fy / norm;
    if(outgoing) return arrow(x+c*7,y+s*7,x+c*43,y+s*43,rust,2)+label(x+c*28,y+s*28-5,caption,rust,11);
    return arrow(x - c * 43, y - s * 43, x - c * 7, y - s * 7, rust, 2) +
        label(x - c * 48, y - s * 48 + (Math.abs(c) > .7 ? -6 : 2), caption, rust, 11,
              Math.abs(c) > .7 ? (c > 0 ? 'start' : 'end') : 'middle');
  }
  function couple(x, y, value, caption) {
    const sign = Math.sign(value);
    return path(
               `M ${x - 13} ${y + 5 * sign} A 14 14 0 1 ${sign > 0 ? 0 : 1} ${x + 12} ${y - 7 * sign}`,
               rust) +
        arrow(x + 12, y - 7 * sign, x + 8, y - 12 * sign, rust) +
        label(x + 18, y + 17, caption, rust, 10, 'start');
  }
  function distributed(x, y, u, v, qx, qy, caption) {
    const q = Math.hypot(qx, qy);
    if (!q)
      return '';
    const dx = qx / q, dy = -qy / q, L = Math.hypot(u - x, v - y), c = (u - x) / L, s = (v - y) / L;
    // Offset axial loads from the element so their arrows remain visible.
    const off = Math.abs(dx * c + dy * s) > .9 ? 15 : 0;
    x -= s * off;
    u -= s * off;
    y += c * off;
    v += c * off;
    const points = [];
    for (let i = 0, n = Math.max(2, Math.min(16, Math.floor(L / 20))); i <= n; i++) {
      const t = .045 + .91 * i / n, px = x + (u - x) * t, py = y + (v - y) * t;
      points.push([px, py]);
    }
    const [a, b] = points[0], [h, k] = points.at(-1);
    return line(a - 28 * dx, b - 28 * dy, h - 28 * dx, k - 28 * dy, rust, 1) +
        points.map(([px, py]) => arrow(px - 28 * dx, py - 28 * dy, px - 5 * dx, py - 5 * dy, rust, 1))
            .join('') +
        label((a + h) / 2 - 36 * dx, (b + k) / 2 - 36 * dy - 2, caption, rust, 11);
  }
  function ordinates(poly, L) {
    const values = [0, L];
    if (poly.length === 3 && poly[2]) {
      const peak = -poly[1] / (2 * poly[2]);
      if (peak > 1e-9 && peak < L - 1e-9)
        values.push(peak);
    }
    return values.map(x => [x, Mechanics.evaluate(poly, x)]);
  }
  // The solver's positive local moment puts the right-hand fibre in tension.
  // N and T retain their signs when the oriented section is rotated by 180°.
  function diagramField(member, fields, component) {
    const polynomial = fields[component];
    return component === 'M' && member.fiberSide === 'left' ? polynomial.map(v => -v) : polynomial;
  }

  function signLegend(component, unit, height) {
    const color='#303633';
    let drawing=path('M -8 -8 H 8 V 8 H -8 Z', color, 'white', 1)
      + line(-8,11,8,11,color,1,'stroke-dasharray="4 2"')
      + line(-4,0,4,0,color,1)+line(0,-4,0,4,color,1);
    if (component==='N') {
      drawing+=arrow(-11,0,-24,0,color,1)+arrow(11,0,24,0,color,1);
    } else if (component==='T') {
      drawing+=arrow(-12,7,-12,-8,color,1)+arrow(12,-7,12,8,color,1);
    } else {
      drawing+=path('M -11 8 C -23 6 -23 -6 -12 -8 M -16 -12 L -12 -8 -16 -4',color,'none',1)
        +path('M 11 8 C 23 6 23 -6 12 -8 M 16 -12 L 12 -8 16 -4',color,'none',1);
    }
    return `<g transform="translate(36 ${height-19})" aria-label="Convenzione positiva ${component}">${drawing}${label(29,4,component+' ['+unit+']',color,10,'start')}</g>`;
  }

  function diagramLabels(marks, width, height) {
    const occupied=[];
    return marks.map(mark=>{
      const {x,y,c,s,nx,ny,text}=mark;
      const halfWidth=3.1*text.length+1, halfHeight=6;
      const dx=Math.abs(c)*halfWidth+Math.abs(s)*halfHeight;
      const dy=Math.abs(s)*halfWidth+Math.abs(c)*halfHeight;
      let angle=Math.atan2(s,c)*180/Math.PI;
      if (angle>=90) angle-=180;
      if (angle< -90) angle+=180;
      let px=x, py=y;
      // Try small displacements along the same member before moving away from its axis.
      for (const [along,away] of [[0,0],[8,0],[-8,0],[0,10],[14,9],[-14,9],[0,21]]) {
        px=Math.max(dx+1,Math.min(width-dx-1,x+along*c+away*nx));
        py=Math.max(dy+1,Math.min(height-dy-1,y+along*s+away*ny));
        const box=[px-dx,py-dy,px+dx,py+dy];
        if (!occupied.some(b=>box[0]<b[2] && box[2]>b[0] && box[1]<b[3] && box[3]>b[1])) break;
      }
      occupied.push([px-dx,py-dy,px+dx,py+dy]);
      return `<g transform="translate(${px} ${py}) rotate(${angle})">${label(0,3.5,text,'#252b28',10)}</g>`;
    }).join('');
  }

  function draw(svg, model, view, options = {}) {
    const {width: w, height: h} = view, {result, state, component, reduced, selected, first} = options;
    const fmt = options.decimals ? NumericDisplay.decimal : NumericDisplay.fraction;
    const editable = !state, showLoads = editable || options.showLoads,
          nodes = new Map(model.nodes.map(n => [n.id, n]));
    const at = id => pos(nodes.get(id), view);
    // Loads are captioned as on the exam sheets: multiples of F, of W = Fb and of q = F/b.
    const caption = (value, symbol) => (Math.abs(value) === 1 ? '' : fmt(Math.abs(value))) + symbol;
    const centralHinges = new Set(model.nodes.filter(n => {
      if(n.m || n.support!=='free') return false;
      const ends=model.members.filter(e=>e.a===n.id || e.b===n.id);
      return ends.length===2 && ends.some(e=>e.type==='bar' || (e.a===n.id?e.hi:e.hj));
    }).map(n=>n.id));
    const rel = reduced ? result.free.map(i => result.descriptors[i]) : [];
    const realLoads = !state || state === result.primary || state === result.final;
    const serviceIndex = state ? result.service.indexOf(state) : -1;
    const unitLoad = serviceIndex >= 0 ? rel[serviceIndex] : null;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const gridID = svg.id + '-grid';
    let spacing = view.scale * (options.step || .5);
    if (!Number.isFinite(spacing) || spacing <= 0)
      spacing = 24;
    while (spacing < 12)
      spacing *= 2;
    let out = `<defs><pattern id="${gridID}" x="${view.ox}" y="${view.oy}" width="${spacing}" height="${
        spacing}" patternUnits="userSpaceOnUse"><path d="M ${spacing} 0 H 0 V ${
        spacing}" fill="none" stroke="#d7e3db" stroke-width=".85"/></pattern></defs><rect width="100%" height="100%" fill="url(#${
        gridID})"/>`;
    if (!editable) out='<rect width="100%" height="100%" fill="white"/>';
    const amplitude=Math.min(46,(h-100)*.108,(w-90)*.18);
    let fibres='', fills = '', members = '', symbols = '', labels = '', hits = '';
    const numbers = [];
    const max = state ?
        Math.max(
            1e-12,
            ...state.fields.flatMap(
                (f, k) => ordinates(f[component], result.elements[k].L).map(p => Math.abs(p[1])))) :
        1;
    model.members.forEach((e, k) => {
      const [x, y] = at(e.a), [u, v] = at(e.b), L = Math.hypot(u - x, v - y);
      if (!L)
        return;
      const c = (u - x) / L, s = (v - y) / L, chosen = selected === 'e' + k;
      const releases = rel.filter(d => d.k === k && d.kind !== 'r');
      
      // In SVG y points down. (-s,c) is the right normal seen from node i towards j.
      const side=e.fiberSide==='left' ? -1 : 1, nx=-s*side, ny=c*side;
      const inset=Math.min(4,L*.12), offset=editable ? 4.5 : 3.2;
      fibres+=line(x+c*inset+offset*nx,y+s*inset+offset*ny,u-c*inset+offset*nx,v-s*inset+offset*ny,
                   editable ? green : '#434743', .95, 'class="fiber-mark" stroke-dasharray="6 3"');
      if (state) {
        const poly=diagramField(e,state.fields[k],component), len=result.elements[k].L;
        const point=(t,force)=>[x+t*(u-x)+nx*force/max*amplitude, y+t*(v-y)+ny*force/max*amplitude];
        const atFraction=t=>Mechanics.evaluate(poly,t*len);
        const start=atFraction(0), mid=atFraction(.5), end=atFraction(1);
        // A quadratic Bézier exactly represents a uniformly loaded beam's moment curve.
        const control=point(.5,2*mid-(start+end)/2);
        if (Math.max(Math.abs(start),Math.abs(mid),Math.abs(end))>max*1e-10) {
          const segments=Math.max(2,Math.ceil(L/4.5));
          let ribs='';
          for (let j=1;j<segments;j++) {
            const t=j/segments;
            ribs+='M '+point(t,0).join(' ')+' L '+point(t,atFraction(t)).join(' ')+' ';
          }
          fills+=path(ribs,'#535653','none',.7,'class="diagram-ribs"');
          fills+=path('M '+[x,y].join(' ')+' L '+point(0,start).join(' ')+' Q '+control.join(' ')+' '+
              point(1,end).join(' ')+' L '+[u,v].join(' '),'#252825','none',1.25,'class="diagram-envelope"');
        }
        const marks=Math.abs(start-mid)+Math.abs(end-mid)<max*1e-10 ? [[.5,mid]] : [[0,start],[1,end]];
        const peak=ordinates(poly,len)[2];
        if (peak && Math.abs(peak[1])>Math.max(Math.abs(start),Math.abs(end))+max*1e-10)
          marks.push([peak[0]/len,peak[1],true]);
        for (const [t,value,isPeak] of marks) {
          const text=fmt(value);
          const inset=Math.min(.35,(7+text.length*3.1)/L);
          const position=Math.max(inset,Math.min(1-inset,t));
          const sign=(value < -max*1e-10 ? 1 : -1)*(isPeak ? -1 : 1);
          const base=point(position,isPeak ? value : 0);
          numbers.push({x:base[0]+nx*sign*9,y:base[1]+ny*sign*9,
                        c,s,nx:nx*sign,ny:ny*sign,text});
        }
      }
      if (chosen)
        members += line(x, y, u, v, '#a4d8c8', 8);
      members += line(x, y, u, v, editable ? ink : '#191c19', editable ? (e.type==='bar'?2:3.3) : 1.8);
      if (showLoads && realLoads)
        symbols += distributed(x, y, u, v, e.qx, e.qy, caption(Math.hypot(e.qx,e.qy),'q'));
      if (showLoads && realLoads && e.type==='bar' && e.eps)
        symbols += path('M -4 -4 h 8 v 8 h -8 Z',green,'none',1,
          `transform="translate(${(x+u)/2} ${(y+v)/2})"`);
      if (editable) for (const [hinge, px, py, sign, kind] of [[e.hi, x, y, 1, 'mi'], [e.hj, u, v, -1, 'mj']]) {
        if (!centralHinges.has(kind==='mi'?e.a:e.b) && (hinge || e.type === 'bar' || releases.some(d => d.kind === kind)))
          symbols += circle(px + c * 8 * sign, py + s * 8 * sign, 3.8, green, '#fff', 1.4);
      }
      if (editable) for (const [kSpring, px, py, sign, kind] of [[e.springI, x, y, 1, 'mi'], [e.springJ, u, v, -1, 'mj']]) {
        if (kSpring && !releases.some(d => d.kind === kind)) {
          const cx = px + c * 13 * sign, cy = py + s * 13 * sign;
          symbols += path(`M ${cx - 5} ${cy} a 5 5 0 1 1 5 5 a 3 3 0 1 1 3 -3`, green, '#f2faf6', 1.5);
        }
      }
      if (showLoads && unitLoad && unitLoad.kind !== 'r' && unitLoad.k === k) {
        if (unitLoad.kind === 'n') {
          // Positive tension in a removed bar pulls its attachment nodes together.
          const bx = e.type === 'bar' ? u : x + 32 * c, by = e.type === 'bar' ? v : y + 32 * s;
          symbols +=
              arrow(x, y, x + 22 * c, y + 22 * s, rust, 2) + arrow(bx, by, bx - 22 * c, by - 22 * s, rust, 2);
        } else {
          const atI = unitLoad.kind === 'mi', sign = atI ? 1 : -1, px = atI ? x : u, py = atI ? y : v;
          // Applied to the isolated member: -Mi at i and +Mj at j.
          symbols += couple(px + 23 * c * sign, py + 23 * s * sign, -sign) +
              couple(px - 12 * c * sign, py - 12 * s * sign, sign);
        }
      }
      hits += line(x, y, u, v, 'transparent', 17, `data-edge="${k}" style="cursor:pointer"`);
    });
    model.nodes.forEach((n, i) => {
      const [x, y] = at(n.id), chosen = selected === 'n' + i || first === n.id;
      const axes = Mechanics.supportAxes[n.support].filter(
          d => !rel.some(a => a.kind === 'r' && a.k === i && a.d === d));
      if (editable) symbols += support(x, y, axes);
      if (showLoads && realLoads) {
        symbols += pointLoad(x, y, n.fx, 0, caption(n.fx, 'F'), (x-w/2)*n.fx>0) +
            pointLoad(x, y, 0, n.fy, caption(n.fy, 'F'));
        if (n.m)
          symbols += couple(x, y, n.m, caption(n.m,'W'));
      }
      if (showLoads && unitLoad?.kind === 'r' && unitLoad.k === i) {
        symbols += unitLoad.d === 2 ?
            couple(x, y, 1) :
            pointLoad(x, y, unitLoad.d === 0 ? 1 : 0, unitLoad.d === 1 ? 1 : 0, 'X=1');
      }
      if (!editable) return;
      if (chosen)
        symbols += circle(x, y, 9, '#add6c6', '#cceada', 1);
      symbols += centralHinges.has(n.id) ? circle(x,y,4.6,green,'#fff',1.5) : circle(x,y,2,ink,ink,1);
      labels += label(x + 8, y - 8, n.id, ink, 12, 'start');
      hits +=
          `<circle cx="${x}" cy="${y}" r="11" fill="transparent" data-node="${i}" style="cursor:pointer"/>`;
    });
    if (!editable) labels+=diagramLabels(numbers,w,h);
    if (editable && model.nodes.length > 1) {
      // Dimension chains along both axes, in multiples of b.
      const levels = key => [...new Set(model.nodes.map(n => Number(n[key].toFixed(9))))].sort((p, q) => p - q);
      const xs = levels('x'), ys = levels('y');
      const quote = value => (Math.abs(value - 1) < 1e-9 ? '' : fmt(value)) + 'b';
      if (xs.length <= 9 && ys.length <= 9) {
        const bottom = view.oy - ys[0] * view.scale + 50, left = view.ox + xs[0] * view.scale - 58;
        const px = v => view.ox + v * view.scale, py = v => view.oy - v * view.scale;
        if (xs.length > 1) labels += line(px(xs[0]), bottom, px(xs.at(-1)), bottom, faint, 1);
        if (ys.length > 1) labels += line(left, py(ys[0]), left, py(ys.at(-1)), faint, 1);
        xs.forEach((v, k) => {
          if (xs.length > 1) labels += line(px(v), bottom - 3, px(v), bottom + 3, faint, 1);
          if (k) labels += label((px(v) + px(xs[k - 1])) / 2, bottom + 13, quote(v - xs[k - 1]), ink, 10);
        });
        ys.forEach((v, k) => {
          if (ys.length > 1) labels += line(left - 3, py(v), left + 3, py(v), faint, 1);
          if (k) labels += label(left - 6, (py(v) + py(ys[k - 1])) / 2 + 4, quote(v - ys[k - 1]), ink, 10, 'end');
        });
      }
    }
    out += fills + fibres + members + symbols + labels + (editable ? hits : '');
    if (editable) {
      out += arrow(22, h - 48, 48, h - 48, faint, 1) + arrow(22, h - 48, 22, h - 71, faint, 1) +
          label(52, h - 45, 'x', faint, 10) + label(21, h - 76, 'y', faint, 10);
    }
    if (!editable) {
      out+=signLegend(component,component==='M'?'Fb':'F',h);
    }
    svg.innerHTML = out;
  }
  return {draw, viewport, esc, fraction: NumericDisplay.fraction, ordinates, diagramField};
})();
