/* brush3d.js — แปรง 3D (วาดด้วยแสงเงาในตัว) และเครื่องมือทำให้ชั้นงานนูน
   แปรงทุกตัวเป็น "สแตมป์" ที่ลงสีพร้อมแสง/เงาลงบนพิกเซลโดยตรง
   จึงใช้ร่วมกับย้อนกลับ ชั้นงาน ส่งออก และบันทึกอัตโนมัติได้ตามปกติ */
(function (G) {
  'use strict';
  const B3 = G.B3 = { dir: 0, la: -135 * Math.PI / 180, gl: 1, dp: 1, br: 1 }; // dir = ทิศที่เส้นกำลังลาก, la = ทิศที่แสงมาจาก
  try { const v = parseFloat(localStorage.getItem('sh4la')); if (isFinite(v)) B3.la = v * Math.PI / 180; } catch (e) { /* ไม่เป็นไร */ }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function parse(col) {
    let m = /^#([0-9a-f]{6})$/i.exec(col);
    if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    m = /^#([0-9a-f]{3})$/i.exec(col);
    if (m) return [...m[1]].map(ch => parseInt(ch + ch, 16));
    m = /rgba?\(([^)]+)\)/.exec(col);
    if (m) return m[1].split(',').slice(0, 3).map(v => +v);
    return [34, 34, 34];
  }
  // f > 0 ผสมกับขาว, f < 0 ผสมกับดำ
  function shade(col, f) {
    const c = parse(col);
    return 'rgb(' + c.map(v => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))).join(',') + ')';
  }
  const light = () => ({ x: Math.cos(B3.la), y: Math.sin(B3.la) });

  /* ---------- ทรงกลมเงา: ใช้ในเจล / ลูกปัด / ดินน้ำมัน ---------- */
  function sphere(c, x, y, r, col, o) {
    o = o || {};
    const L = light(), hx = x + L.x * r * .38, hy = y + L.y * r * .38;
    const g = c.createRadialGradient(hx, hy, 0, x, y, r);
    const hi = (o.hi == null ? .5 : o.hi) * B3.gl, lo = (o.lo == null ? -.38 : o.lo) * B3.dp;
    g.addColorStop(0, shade(col, Math.min(1, hi)));
    g.addColorStop(.38, col);
    g.addColorStop(.85, shade(col, Math.max(-.95, lo)));
    g.addColorStop(1, shade(col, Math.max(-.97, lo - .2 * B3.dp)));
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    if (o.spec !== 0 && r > 3) { // จุดสะท้อนแสง
      const sx = x + L.x * r * .5, sy = y + L.y * r * .5, sr = r * (o.spec || .2);
      const sg = c.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(255,255,255,' + Math.min(1, .95 * B3.gl) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    }
  }

  const B3D = {
    gel: {
      d3: true, n: '🧊 เจลนูน', tip: 'เส้นนูนเป็นหลอด 3D มีไฮไลต์ — ใช้เขียนตัวหนังสือ/ตัดเส้นสไตล์สติกเกอร์', gap: .07,
      fn: (c, x, y, s, p, a) => { const col = c.fillStyle; c.globalAlpha = a; sphere(c, x, y, Math.max(1, s * p / 2), col); }
    },
    bead: {
      d3: true, n: '🧊 ลูกปัด', tip: 'ลูกปัด/ไข่มุกวางเรียงตามเส้น มีเงาตกพื้น', gap: 1.05,
      fn: (c, x, y, s, p, a) => {
        const col = c.fillStyle, r = Math.max(1.5, s * p / 2), L = light();
        c.globalAlpha = a;
        const sx = x - L.x * r * .28, sy = y - L.y * r * .28 + r * .12, sg = c.createRadialGradient(sx, sy, r * .2, sx, sy, r * 1.25);
        sg.addColorStop(0, 'rgba(0,0,0,' + Math.min(.9, .4 * B3.dp) + ')'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, r * 1.25, 0, 7); c.fill();
        sphere(c, x, y, r, col, { hi: .65, lo: -.45, spec: .3 });
      }
    },
    impasto: {
      d3: true, n: '🧊 สีน้ำมันหนา', tip: 'ปาดสีหนา เห็นรอยขนแปรงนูน มีแสงเงา — ลากเป็นฝีแปรง', gap: .16,
      fn: (c, x, y, s, p, a) => {
        const col = c.fillStyle, N = clamp(Math.round(s / 3.2 * B3.br), 3, 28), th = B3.dir, nx = -Math.sin(th), ny = Math.cos(th);
        const half = Math.max(2, s * p) / 2, step = Math.max(1, s * .16), len = step * 1.8, bw = Math.max(1.2, (half * 2) / N * 1.3), L = light();
        c.lineCap = 'round'; c.globalAlpha = a;
        for (let i = 0; i < N; i++) {
          if (Math.random() < .06) continue; // ขนแปรงหลุดเป็นช่องแห้ง
          const o = (N === 1 ? 0 : i / (N - 1) - .5) * half * 2, bx = x + nx * o, by = y + ny * o, dx = Math.cos(th) * len / 2, dy = Math.sin(th) * len / 2;
          const v = rnd(-.1, .1), off = bw * .32;
          const line = (ox, oy, w, color) => { c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(bx - dx + ox, by - dy + oy); c.lineTo(bx + dx + ox, by + dy + oy); c.stroke(); };
          line(-L.x * off, -L.y * off, bw, shade(col, Math.max(-.95, -.34 * B3.dp + v)));      // เงาด้านตรงข้ามแสง
          line(0, 0, bw * .78, shade(col, v));                          // เนื้อสี
          line(L.x * off, L.y * off, bw * .34, shade(col, Math.min(1, .42 * B3.gl + v)));    // ไฮไลต์ด้านรับแสง
        }
      }
    },
    clay: {
      d3: true, n: '🧊 ดินน้ำมัน', tip: 'ก้อนดินปั้นนุ่ม ผิวด้าน ขอบไม่เรียบ — ปั้นลายนูนเล่นๆ', gap: .13,
      fn: (c, x, y, s, p, a) => {
        const col = c.fillStyle, r = Math.max(1.5, s * p / 2);
        c.globalAlpha = a;
        sphere(c, x, y, r, col, { hi: .28, lo: -.3, spec: 0 });
        for (let i = 0; i < 4; i++) { const t = rnd(0, 6.283), d = r * rnd(.55, .9); sphere(c, x + Math.cos(t) * d, y + Math.sin(t) * d, r * rnd(.22, .38), col, { hi: .25, lo: -.28, spec: 0 }); }
      }
    },
    chrome: {
      d3: true, n: '🧊 โครเมียม', tip: 'หลอดโลหะเงา สะท้อนแสงเป็นแถบ — ใช้สีที่เลือกเป็นโทนโลหะ', gap: .07,
      fn: (c, x, y, s, p, a) => {
        const col = c.fillStyle, r = Math.max(1, s * p / 2), L = light();
        const g = c.createLinearGradient(x + L.x * r, y + L.y * r, x - L.x * r, y - L.y * r);
        g.addColorStop(0, shade(col, Math.min(1, .75 * B3.gl))); g.addColorStop(.22, col); g.addColorStop(.45, shade(col, -.55 * B3.dp));
        g.addColorStop(.58, shade(col, Math.min(1, .35 * B3.gl))); g.addColorStop(.8, shade(col, -.2 * B3.dp)); g.addColorStop(1, shade(col, Math.max(-.97, -.6 * B3.dp)));
        c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      }
    }
  };

  /* ---------- แปรงหลอด 3D (แบบ ibisPaint / Procreate) ----------
     ทุกสแตมป์คือ "ทรงกลม" ที่เก็บความสูงและทิศพื้นผิวไว้ในอาร์เรย์ของเส้นนั้น (ความสูงสูงสุดชนะ)
     เส้นที่ต่อกันจึงกลายเป็นหลอดกลมจริง แล้วค่อยคำนวณแสงเงาทีละพิกเซลจากทิศพื้นผิวนั้น
     ไม่ว่าลากทิศไหนหลอดก็สว่างด้านรับแสง มืดด้านตรงข้าม มีไฮไลต์ แสงสะท้อนที่ขอบ และเงาตกพื้น
     ผลลัพธ์ถูกวางทับภาพต้นฉบับของชั้น (ภาพก่อนเริ่มเส้น) จึงย้อนกลับ/ล็อกอัลฟา/ความเข้มสี ทำงานตามปกติ */
  const STY = {
    gloss: { gA: 3.6, dA: .62, sp: .9, shin: 46, bc: .30, wrap: .3 },  // มันเงาแบบ ibisPaint
    matte: { gA: 2.4, dA: .42, sp: .10, shin: 9, bc: .22, wrap: .45 }  // นุ่มด้านแบบ Procreate
  };
  const SC = 64; // ตัวคูณความสูงเก็บใน Uint16
  function Eng(w, h) {
    const n = w * h;
    this.w = w; this.h = h;
    this.H = new Uint16Array(n); this.NX = new Int8Array(n); this.NY = new Int8Array(n);
    this.CV = new Uint8Array(n); this.SH = new Uint8Array(n);
    this.bb = null; this.pend = []; this.key = null; this.snap = null;
    this.col = [34, 34, 34]; this.a = 1; this.gl = 1; this.dp = 1; this.st = 'gloss'; this.op = 'source-over';
    this.sc = null; this.scc = null; this.buf = null; this.spec = {};
  }
  Eng.prototype.reset = function () {
    const b = this.bb, w = this.w;
    if (b) for (let j = b.y0; j <= b.y1; j++) {
      const s = j * w + b.x0, e = j * w + b.x1 + 1;
      this.H.fill(0, s, e); this.NX.fill(0, s, e); this.NY.fill(0, s, e); this.CV.fill(0, s, e); this.SH.fill(0, s, e);
    }
    this.bb = null; this.pend = [];
  };
  Eng.prototype.setup = function (col, a, st, op) {
    this.col = parse(col); this.a = a; this.st = st; this.op = op || 'source-over';
    this.gl = B3.gl; this.dp = B3.dp;
  };
  function addRect(list, r) {
    for (const q of list) if (r.x0 <= q.x1 + 4 && r.x1 >= q.x0 - 4 && r.y0 <= q.y1 + 4 && r.y1 >= q.y0 - 4) {
      q.x0 = Math.min(q.x0, r.x0); q.y0 = Math.min(q.y0, r.y0); q.x1 = Math.max(q.x1, r.x1); q.y1 = Math.max(q.y1, r.y1); return;
    }
    list.push({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 });
  }
  // วางทรงกลมรัศมี r ที่ (x,y) พร้อมเงาตกพื้น
  Eng.prototype.dome = function (x, y, r) {
    const w = this.w, h = this.h, L = light();
    r = Math.max(.8, r);
    const m = Math.ceil(r * 1.9) + 2;
    const R = { x0: Math.max(0, Math.floor(x - m)), y0: Math.max(0, Math.floor(y - m)), x1: Math.min(w - 1, Math.ceil(x + m)), y1: Math.min(h - 1, Math.ceil(y + m)) };
    if (R.x0 > R.x1 || R.y0 > R.y1) return;
    this.bb = this.bb ? { x0: Math.min(this.bb.x0, R.x0), y0: Math.min(this.bb.y0, R.y0), x1: Math.max(this.bb.x1, R.x1), y1: Math.max(this.bb.y1, R.y1) } : { x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y1 };
    addRect(this.pend, R);
    const H = this.H, NX = this.NX, NY = this.NY, CV = this.CV, SH = this.SH, r2 = r * r;
    // ตัวหลอด
    const tx0 = Math.max(0, Math.floor(x - r - 1)), tx1 = Math.min(w - 1, Math.ceil(x + r + 1)), ty0 = Math.max(0, Math.floor(y - r - 1)), ty1 = Math.min(h - 1, Math.ceil(y + r + 1));
    for (let j = ty0; j <= ty1; j++) {
      const dy = j + .5 - y, row = j * w;
      for (let i = tx0; i <= tx1; i++) {
        const dx = i + .5 - x, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= r + .5) continue;
        const k = row + i, cov = d <= r - .5 ? 255 : Math.round((r + .5 - d) * 255);
        if (cov > CV[k]) CV[k] = cov;
        const dd = d > r ? r : d, hh = Math.round(Math.sqrt(r2 - dd * dd) * SC) + 1;
        if (hh >= H[k]) { H[k] = hh; const q = d > r ? r / d : 1 / r * 1; const f = d > r ? 1 / d : 1 / r; NX[k] = Math.round(dx * f * 127); NY[k] = Math.round(dy * f * 127); }
      }
    }
    // เงาตกพื้น (ใช้ค่าสูงสุด ไม่สะสม เส้นจึงเรียบ)
    const ox = x - L.x * r * .46, oy = y - L.y * r * .46, Rs = r * 1.45, A0 = Math.min(1, .46 * this.dp);
    const sx0 = Math.max(0, Math.floor(ox - Rs)), sx1 = Math.min(w - 1, Math.ceil(ox + Rs)), sy0 = Math.max(0, Math.floor(oy - Rs)), sy1 = Math.min(h - 1, Math.ceil(oy + Rs));
    for (let j = sy0; j <= sy1; j++) {
      const dy = j + .5 - oy, row = j * w;
      for (let i = sx0; i <= sx1; i++) {
        const dx = i + .5 - ox, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= Rs) continue;
        const t = 1 - d / Rs, v = Math.round(A0 * t * t * 255), k = row + i;
        if (v > SH[k]) SH[k] = v;
      }
    }
  };
  // คำนวณแสงเงาของสี่เหลี่ยม คืนอาร์เรย์ RGBA (ไม่แตะ DOM ทดสอบด้วย Node ได้)
  Eng.prototype.shade = function (x0, y0, rw, rh) {
    const w = this.w, st = STY[this.st] || STY.gloss, gl = this.gl, dp = this.dp;
    const need = rw * rh * 4;
    if (!this.buf || this.buf.length < need) this.buf = new Uint8ClampedArray(need);
    const out = this.buf; out.fill(0, 0, need);
    const La = light(), el = 58 * Math.PI / 180, ce = Math.cos(el), Lx = La.x * ce, Ly = La.y * ce, Lz = Math.sin(el);
    let hx = Lx, hy = Ly, hz = Lz + 1; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
    const d0 = (Lz + st.wrap) / (1 + st.wrap), gA = st.gA * gl, dA = Math.min(1.4, st.dA * dp), sp = st.sp * gl, bc = st.bc;
    let spec = this.spec[this.st];
    if (!spec) { spec = this.spec[this.st] = new Float32Array(256); for (let i = 0; i < 256; i++) spec[i] = Math.pow(i / 255, st.shin); }
    const cr = this.col[0], cg = this.col[1], cb = this.col[2], sr = cr * .28, sg = cg * .28, sb = cb * .28;
    const H = this.H, NX = this.NX, NY = this.NY, CV = this.CV, SH = this.SH;
    for (let j = 0; j < rh; j++) {
      for (let i = 0; i < rw; i++) {
        const k = (y0 + j) * w + x0 + i, ca = CV[k] / 255, sa = SH[k] / 255;
        if (ca === 0 && sa === 0) continue;
        let r = sr, g = sg, b = sb, oa = sa;
        if (ca > 0) {
          const nx = NX[k] / 127, ny = NY[k] / 127, nz2 = 1 - nx * nx - ny * ny, nz = nz2 > 0 ? Math.sqrt(nz2) : 0;
          const nl = nx * Lx + ny * Ly + nz * Lz, dw = Math.max(0, (nl + st.wrap) / (1 + st.wrap)), t = dw - d0;
          let tr = cr, tg = cg, tb = cb;
          if (t > 0) { const f = Math.min(1, t * gA); tr += (255 - tr) * f; tg += (255 - tg) * f; tb += (255 - tb) * f; }
          else { const f = Math.min(.95, -t * dA); tr *= 1 - f; tg *= 1 - f; tb *= 1 - f; }
          const rim = 1 - nz, away = -(nx * La.x + ny * La.y);       // แสงสะท้อนจากพื้นที่ขอบด้านเงา
          if (away > 0) { const f = Math.min(.8, rim * rim * away * bc * (.4 + .6 * dp)); tr += (255 - tr) * f; tg += (255 - tg) * f; tb += (255 - tb) * f; }
          const nh = nx * hx + ny * hy + nz * hz;
          if (nh > 0) { const f = Math.min(1, spec[(nh * 255) | 0] * sp); tr += (255 - tr) * f; tg += (255 - tg) * f; tb += (255 - tb) * f; }
          oa = ca + sa * (1 - ca);
          const wc = ca / oa, ws = 1 - wc;
          r = tr * wc + sr * ws; g = tg * wc + sg * ws; b = tb * wc + sb * ws;
        }
        const o = (j * rw + i) * 4;
        out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = oa * 255;
      }
    }
    return out;
  };
  // วาดส่วนที่เปลี่ยนลงชั้นงาน: คืนภาพเดิมของชั้น (snap) แล้ววางหลอดทับ
  Eng.prototype.flush = function (ctx, snap) {
    const list = this.pend; this.pend = [];
    for (const p of list) {
      const x0 = Math.max(0, p.x0), y0 = Math.max(0, p.y0), x1 = Math.min(this.w - 1, p.x1), y1 = Math.min(this.h - 1, p.y1), rw = x1 - x0 + 1, rh = y1 - y0 + 1;
      if (rw < 1 || rh < 1) continue;
      const data = this.shade(x0, y0, rw, rh);
      if (!this.sc) { this.sc = document.createElement('canvas'); this.sc.width = this.w; this.sc.height = this.h; this.scc = this.sc.getContext('2d'); }
      this.scc.putImageData(new ImageData(data.subarray(0, rw * rh * 4), rw, rh), 0, 0);
      ctx.save();
      if (snap) ctx.putImageData(snap, 0, 0, x0, y0, rw, rh);
      ctx.globalAlpha = this.a; ctx.globalCompositeOperation = this.op;
      ctx.drawImage(this.sc, 0, 0, rw, rh, x0, y0, rw, rh);
      ctx.restore();
    }
  };
  G.TubeEng = Eng;

  let ENG = null, PVE = null;
  function layerEng() {
    if (!ENG || ENG.w !== W || ENG.h !== H) { ENG = new Eng(W, H); }
    const top = ud[ud.length - 1];
    if (ENG.key !== top) { ENG.reset(); ENG.key = top; ENG.snap = top && top.d && top.d.width === W && top.d.height === H ? top.d : null; }
    return ENG;
  }
  G.TubeReset = function () { if (ENG) ENG.key = null; };
  const tubeFn = style => (c, x, y, s, p, a) => {
    const r = Math.max(.8, s * p / 2);
    if (c.canvas === LY[act].c) { layerEng().setup(c.fillStyle, a, style, LY[act].al ? 'source-atop' : 'source-over'); ENG.dome(x, y, r); return; }
    // ภาพตัวอย่างในหน้าตั้งค่าแปรง: สะสมสแตมป์ แล้ววาดทีเดียวหลังลูปเสร็จ
    const cw = c.canvas.width, ch = c.canvas.height;
    if (!PVE || PVE.w !== cw || PVE.h !== ch) PVE = new Eng(cw, ch);
    PVE.setup(c.fillStyle, a, style, 'source-over'); PVE.dome(x, y, r);
    if (!PVE.sched) { PVE.sched = 1; const e = PVE; setTimeout(() => { e.flush(c, null); e.reset(); e.sched = 0; }, 0); }
  };
  const tubeFlush = () => { if (ENG && ENG.key === ud[ud.length - 1] && ENG.pend.length) ENG.flush(LY[act].c.getContext('2d'), ENG.snap); };
  const TUBES = {
    tube: { d3: true, n: '🧊 หลอด 3D (มัน)', tip: 'หลอดพองๆ เงามันแบบ ibisPaint — ลากต่อเนื่องเขียนตัวหนังสือหรือลายเส้นได้เลย (ปรับทิศแสงที่ 🎛 แก้ไข → เอฟเฟกต์ 3D)', gap: .05, fn: tubeFn('gloss'), flush: tubeFlush },
    tubem: { d3: true, n: '🧊 หลอดนุ่ม (ด้าน)', tip: 'หลอดนุ่มๆ ผิวด้านแบบ Procreate — เหมาะกับสีพาสเทลและตัวอักษรน่ารัก', gap: .05, fn: tubeFn('matte'), flush: tubeFlush }
  };
  Object.keys(B3D).forEach(k => { TUBES[k] = B3D[k]; });
  Object.keys(B3D).forEach(k => delete B3D[k]); Object.assign(B3D, TUBES);
  G.B3D = B3D;

  /* ---------- ทำให้ชั้นงานนูน (bevel จากความโปร่งของชั้น) ---------- */
  function boxBlur(src, W, H, r) {
    const tmp = new Float32Array(W * H), out = new Float32Array(W * H), k = 1 / (2 * r + 1);
    for (let y = 0; y < H; y++) {
      let sum = 0; const row = y * W;
      for (let i = -r; i <= r; i++) sum += src[row + clamp(i, 0, W - 1)];
      for (let x = 0; x < W; x++) {
        tmp[row + x] = sum * k;
        sum += src[row + Math.min(W - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += tmp[clamp(i, 0, H - 1) * W + x];
      for (let y = 0; y < H; y++) {
        out[y * W + x] = sum * k;
        sum += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
      }
    }
    return out;
  }

  // คืนภาพ ImageData ที่ใส่แสงเงาแล้ว (ไม่แตะ DOM — ทดสอบด้วย Node ได้)
  function bevel(d, W, H, r, intensity, lx, ly) {
    const n = W * H, a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = d[i * 4 + 3] / 255;
    let h = boxBlur(a, W, H, r); h = boxBlur(h, W, H, Math.max(1, Math.round(r * .7)));
    const S = r * 2.4 * intensity, lz = .55, ln = Math.hypot(lx * .8, ly * .8, lz), Lx = lx * .8 / ln, Ly = ly * .8 / ln, Lz = lz / ln, flat = Lz, out = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) {
      const y0 = Math.max(0, y - 1), y1 = Math.min(H - 1, y + 1);
      for (let x = 0; x < W; x++) {
        const i = y * W + x; if (a[i] === 0) continue;
        const x0 = Math.max(0, x - 1), x1 = Math.min(W - 1, x + 1);
        const gx = (h[y * W + x1] - h[y * W + x0]) / (x1 - x0), gy = (h[y1 * W + x] - h[y0 * W + x]) / (y1 - y0);
        const nx = -gx * S, ny = -gy * S, nl = Math.hypot(nx, ny, 1);
        const f = ((nx * Lx + ny * Ly + Lz) / nl - flat) * 1.5, o = i * 4;
        for (let k = 0; k < 3; k++) { const v = d[o + k]; out[o + k] = f >= 0 ? v + (255 - v) * Math.min(1, f * 1.4) : v * Math.max(.12, 1 + f * 1.4); }
      }
    }
    return out;
  }
  G.B3Math = { bevel, boxBlur, shade };

  // หมายเหตุ: LY act W H snap render saveSoon เป็นตัวแปรส่วนกลางของ studio.html (let/function) เรียกชื่อตรงๆ ได้
  function relief() {
    const l = LY[act];
    if (!l.v || l.lk) return toast('ชั้นถูกซ่อนหรือล็อกอยู่');
    const w = W, h = H, c = l.c.getContext('2d'), im = c.getImageData(0, 0, w, h);
    let any = false; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) { any = true; break; }
    if (!any) return toast('ชั้นนี้ยังว่าง วาดรูปทรงหรือตัวอักษรก่อน');
    snap();
    const r = Math.max(1, Math.round(+$('b3s').value)), it = +$('b3i').value / 100, L = light();
    const lit = bevel(im.data, w, h, r, it, L.x, L.y);
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    t.getContext('2d').putImageData(new ImageData(lit, w, h), 0, 0);
    c.save(); c.clearRect(0, 0, w, h);
    if ($('b3d').checked) { c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = r * 1.3; c.shadowOffsetX = -L.x * r * .9; c.shadowOffsetY = -L.y * r * .9; }
    c.drawImage(t, 0, 0); c.restore();
    render(); saveSoon(); toast('ทำให้นูนแล้ว (ย้อนกลับได้)');
  }

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('b3l'), b = document.getElementById('b3g');
    if (sel) {
      sel.value = String(Math.round(B3.la * 180 / Math.PI));
      if (sel.value !== String(Math.round(B3.la * 180 / Math.PI))) sel.value = '-135';
      sel.onchange = () => { B3.la = +sel.value * Math.PI / 180; try { localStorage.setItem('sh4la', sel.value); } catch (e) { /* ไม่เป็นไร */ } };
    }
    if (b) b.onclick = relief;
  });
})(window);
