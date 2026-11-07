// QUINTIA · gráfico animado para respuestas del agente (spec estructurado → SVG)
var makeAlientoChart = function (React) {
  const h = React.createElement;
  const F = 'var(--font-titulos), Montserrat, system-ui, sans-serif';
  const fmt = (v, d) => (d ? Number(v).toFixed(d).replace('.', ',') : Math.round(v).toLocaleString('es-CO'));
  const nice = m => { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
  class Chart extends React.Component {
    constructor(p) { super(p); this.state = { p: 0, h: null }; }
    componentDidMount() {
      const rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (rm) return this.setState({ p: 1 });
      const t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 900); this.setState({ p: 1 - Math.pow(1 - k, 3) }); if (k < 1) this.raf = requestAnimationFrame(step); };
      this.raf = requestAnimationFrame(step);
    }
    componentWillUnmount() { cancelAnimationFrame(this.raf); }
    tip(x, y, text, W) {
      const w = Math.max(60, text.length * 6.6 + 16); const tx = Math.min(Math.max(x - w / 2, 2), W - w - 2);
      return h('g', { key: 'tip', pointerEvents: 'none' }, h('rect', { x: tx, y: y - 30, width: w, height: 24, rx: 6, fill: '#0F2D3B' }), h('text', { x: tx + w / 2, y: y - 14, textAnchor: 'middle', fontSize: 12, fill: '#fff', fontFamily: F }, text));
    }
    render() {
      const s = this.props.spec || {}; const p = this.state.p; const hv = this.state.h;
      const d = s.decimals || 0; const unit = s.unit || '';
      const set = i => () => this.setState({ h: i }); const clr = () => this.setState({ h: null });
      if (s.type === 'hbar') {
        const rows = s.labels.length, W = 560, rowH = 34, H = rows * rowH + 16, L = 150, R = 70;
        const max = s.max || nice(Math.max.apply(null, s.values.concat(s.ref ? [s.ref.value] : [])));
        const sx = v => (W - L - R) * v / max;
        const kids = [];
        s.labels.forEach((lb, i) => {
          const y = 8 + i * rowH, c = (s.colors && s.colors[i]) || (s.hi === i ? '#31C6E6' : '#0F2D3B');
          kids.push(h('text', { key: 'l' + i, x: L - 10, y: y + 19, textAnchor: 'end', fontSize: 13, fill: '#0F2D3B', fontFamily: F, fontWeight: s.hi === i ? 500 : 400 }, lb));
          kids.push(h('rect', { key: 'bg' + i, x: L, y: y + 5, width: W - L - R, height: 20, rx: 4, fill: '#F7F5EF' }));
          kids.push(h('rect', { key: 'b' + i, x: L, y: y + 5, width: Math.max(0, sx(s.values[i]) * p), height: 20, rx: 4, fill: c, opacity: hv === null || hv === i ? 1 : 0.55, onMouseEnter: set(i), onMouseLeave: clr, style: { cursor: 'default' } }));
          kids.push(h('text', { key: 'v' + i, x: L + sx(s.values[i]) * p + 8, y: y + 20, fontSize: 13, fontWeight: 500, fill: '#0F2D3B', fontFamily: F, opacity: p }, fmt(s.values[i], d) + unit));
        });
        if (s.ref) { const x = L + sx(s.ref.value); kids.push(h('line', { key: 'ref', x1: x, x2: x, y1: 2, y2: H - 4, stroke: '#0F2D3B', strokeDasharray: '5 4', strokeWidth: 1.5 })); }
        if (hv !== null && s.tips) kids.push(this.tip(L + sx(s.values[hv]) * p / 2, 8 + hv * rowH + 4, s.tips[hv], W));
        return h('svg', { viewBox: '0 0 ' + W + ' ' + H, style: { width: '100%', height: 'auto', display: 'block' } }, kids);
      }
      const W = 560, H = 230, L = 46, R = 14, T = 16, B = 34, pw = W - L - R, ph = H - T - B;
      const series = s.series || [{ values: s.values, color: '#0F2D3B' }];
      const all = [].concat.apply([], series.map(x => x.values)).concat(s.ref ? [s.ref.value] : []);
      const ymax = s.yMax || nice(Math.max.apply(null, all) * 1.08);
      const sy = v => T + ph - ph * v / ymax;
      const n = s.labels.length, slot = pw / n;
      const kids = [];
      if (s.bands) s.bands.forEach((b, i) => kids.push(h('rect', { key: 'band' + i, x: L, y: sy(b.to), width: pw, height: sy(b.from) - sy(b.to), fill: b.bg })));
      const ticks = s.ticks || [0, 1, 2, 3, 4].map(k => ymax * k / 4);
      for (let k = 0; k < ticks.length; k++) {
        const v = ticks[k], y = sy(v);
        kids.push(h('line', { key: 'g' + k, x1: L, x2: W - R, y1: y, y2: y, stroke: '#E5E0D5' }));
        kids.push(h('text', { key: 'gt' + k, x: L - 8, y: y + 4, textAnchor: 'end', fontSize: 11, fill: '#6B7280', fontFamily: F }, fmt(v, v % 1 ? 1 : 0)));
      }
      if (s.yLabel) kids.push(h('text', { key: 'yl', x: 4, y: 10, fontSize: 11, fill: '#6B7280', fontFamily: F }, s.yLabel));
      s.labels.forEach((lb, i) => kids.push(h('text', { key: 'x' + i, x: L + slot * i + slot / 2, y: H - 12, textAnchor: 'middle', fontSize: 11, fill: '#6B7280', fontFamily: F }, lb)));
      if (s.type === 'line') {
        const xs = i => L + slot * i + slot / 2;
        series.forEach((se, si) => {
          const pts = se.values.map((v, i) => xs(i) + ',' + sy(v)).join(' ');
          kids.push(h('clipPath', { key: 'cp' + si, id: 'cp' + this._id() + si }, h('rect', { x: 0, y: 0, width: L + pw * p + 10, height: H })));
          kids.push(h('polyline', { key: 'pl' + si, points: pts, fill: 'none', stroke: se.color || '#0F2D3B', strokeWidth: 2.5, strokeLinejoin: 'round', clipPath: 'url(#cp' + this._id() + si + ')' }));
          se.values.forEach((v, i) => {
            const vis = (xs(i) - L) / pw <= p + 0.02;
            kids.push(h('circle', { key: 'c' + si + i, cx: xs(i), cy: sy(v), r: hv === i ? 7 : 5, fill: '#fff', stroke: se.color || '#0F2D3B', strokeWidth: 2.5, opacity: vis ? 1 : 0, onMouseEnter: set(i), onMouseLeave: clr }));
            kids.push(h('text', { key: 't' + si + i, x: xs(i), y: sy(v) - 11, textAnchor: 'middle', fontSize: 12, fontWeight: 500, fill: '#0F2D3B', fontFamily: F, opacity: vis ? 1 : 0 }, fmt(v, d)));
          });
        });
      } else {
        const ns = series.length, bw = Math.min(46, slot * 0.7 / ns);
        series.forEach((se, si) => se.values.forEach((v, i) => {
          if (v === null) return;
          const x = L + slot * i + slot / 2 - (bw * ns) / 2 + si * bw, y = sy(v * p);
          const c = (s.colors && s.colors[i]) || (s.hi === i ? '#0F2D3B' : se.color || '#0F2D3B');
          kids.push(h('rect', { key: 'r' + si + i, x: x + 1, y, width: bw - 2, height: T + ph - y, rx: 4, fill: c, opacity: hv === null || hv === i ? 1 : 0.55, onMouseEnter: set(i), onMouseLeave: clr }));
          if (s.valueLabels !== false) kids.push(h('text', { key: 'vl' + si + i, x: x + bw / 2, y: y - 5, textAnchor: 'middle', fontSize: ns > 1 ? 10 : 12, fontWeight: 500, fill: '#0F2D3B', fontFamily: F, opacity: p }, fmt(v, d)));
        }));
      }
      if (s.ref) {
        const y = sy(s.ref.value);
        kids.push(h('line', { key: 'ref', x1: L, x2: W - R, y1: y, y2: y, stroke: '#0F2D3B', strokeWidth: 1.5, strokeDasharray: '6 4' }));
        kids.push(h('rect', { key: 'refb', x: 0, y: y - 9, width: L - 4, height: 18, rx: 4, fill: '#0F2D3B' }));
        kids.push(h('text', { key: 'refv', x: L - 8, y: y + 4, textAnchor: 'end', fontSize: 11, fontWeight: 500, fill: '#fff', fontFamily: F }, fmt(s.ref.value, d)));
        kids.push(h('text', { key: 'refl', x: W - R, y: y - 6, textAnchor: 'end', fontSize: 11, fill: '#0F2D3B', fontFamily: F }, s.ref.label));
      }
      if (hv !== null) {
        const tipText = s.tips ? s.tips[hv] : s.labels[hv] + ': ' + series.map(se => (se.name ? se.name + ' ' : '') + fmt(se.values[hv], d) + unit).join(' · ');
        const top = Math.min.apply(null, series.map(se => sy(se.values[hv] || 0)));
        kids.push(this.tip(L + slot * hv + slot / 2, Math.max(34, top - 8), tipText, W));
      }
      return h('svg', { viewBox: '0 0 ' + W + ' ' + H, style: { width: '100%', height: 'auto', display: 'block' } }, kids);
    }
    _id() { if (!this.__id) this.__id = Math.random().toString(36).slice(2, 8); return this.__id; }
  }
  return Chart;
};

if (typeof window !== 'undefined') { window.makeAlientoChart = makeAlientoChart; }
export default makeAlientoChart;
