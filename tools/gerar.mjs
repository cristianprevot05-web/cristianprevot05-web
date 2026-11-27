// Gera os SVGs animados do perfil em ../assets.
// GitHub não roda JS no README: o Three.js calcula o globo aqui e o movimento
// vira keyframes CSS/SMIL dentro do SVG. Uso: npm run assets
import * as THREE from 'three';
import * as si from 'simple-icons';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// ── Design DNA: tokens ─────────────────────────────────────────────
const T = {
  bg0: '#050b16', bg1: '#0a1628', bg2: '#0e1f36', line: '#1b3354',
  text: '#e8eef7', muted: '#8ea3c0', dim: '#5d7393',
  green: '#3ee0a1', amber: '#ffb547', blue: '#5cb3ff',
  sans: "'Segoe UI', Inter, system-ui, -apple-system, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', Consolas, 'SF Mono', Menlo, monospace",
  expoOut: 'cubic-bezier(.16,1,.3,1)', // GSAP expo.out
  power3Out: 'cubic-bezier(.215,.61,.355,1)', // GSAP power3.out
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Estilo comum: entrada com stagger (timeline estilo GSAP) e respeito a reduced motion.
const baseCss = `
  .sans{font-family:${T.sans}} .mono{font-family:${T.mono}}
  .in{animation:rise .9s ${T.expoOut} both}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .blink{animation:blink 1.1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  .led{animation:led 2.4s ease-in-out infinite}
  @keyframes led{0%,100%{opacity:1}50%{opacity:.25}}
  .pulse{animation:pulse 4.5s ${T.power3Out} infinite}
  @keyframes pulse{from{stroke-dashoffset:.16}to{stroke-dashoffset:-1}}
  @media (prefers-reduced-motion:reduce){.in,.blink,.led,.pulse,.ch{animation:none}.moving{display:none}}`;

const svg = (w, h, label, css, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<style>${baseCss}${css}</style>
${body}
</svg>\n`;

const save = (name, s) => { writeFileSync(new URL(name, OUT), s); console.log(name, (s.length / 1024).toFixed(1) + 'KB'); };

// Catmull-Rom → Bézier para curvas suaves.
function smoothPath(pts) {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

function icon(slug, x, y, size, color) {
  if (slug === 'zabbix') { // não existe no simple-icons
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="#d40000"/><text x="${x + size / 2}" y="${y + size * 0.76}" text-anchor="middle" class="sans" font-size="${size * 0.72}" font-weight="700" fill="#fff">Z</text>`;
  }
  const ic = si['si' + slug[0].toUpperCase() + slug.slice(1)];
  const fill = color || (['000000', '111111'].includes(ic.hex) ? T.text : '#' + ic.hex);
  return `<path transform="translate(${x} ${y}) scale(${size / 24})" fill="${fill}" d="${ic.path}"/>`;
}

// ── 1. Topo: globo 3D (Three.js) + identidade + gráfico de tráfego ──
function topo() {
  const W = 1000, H = 440, CX = 790, CY = 238, R = 150, DUR = 36, F = 48;

  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  cam.position.set(0, 0, 6); cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const tilt = new THREE.Group(); tilt.rotation.set(0.42, 0, -0.18);
  const spin = new THREE.Group(); tilt.add(spin);
  // raio da silhueta de uma esfera unitária a 6 unidades, em NDC
  const scale = R / ((1 / Math.sqrt(35)) / Math.tan(THREE.MathUtils.degToRad(17.5)));

  const frames = [];
  const project = (v) => {
    const w = v.clone().applyMatrix4(spin.matrixWorld);
    const p = w.clone().project(cam);
    return { x: CX + p.x * scale, y: CY - p.y * scale, z: w.z };
  };
  const atFrame = (f) => { spin.rotation.y = (2 * Math.PI * f) / F; tilt.updateMatrixWorld(true); };
  const fromLatLon = (lat, lon, rad = 1) => {
    const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)).multiplyScalar(rad);
  };

  // Anéis de latitude: cada anel é UM clipe de keyframes; os pontos do anel
  // tocam o mesmo clipe com atraso negativo (como AnimationAction.time no Three.js).
  const lats = [-72, -54, -36, -18, 0, 18, 36, 54, 72];
  let ringCss = '', dots = '';
  lats.forEach((lat, i) => {
    let kf = '';
    for (let f = 0; f <= F; f++) {
      atFrame(f);
      const p = project(fromLatLon(lat, 0));
      const o = 0.08 + 0.92 * smooth(-0.2, 0.5, p.z);
      const s = 0.55 + 0.65 * ((p.z + 1) / 2);
      kf += `${r2((f / F) * 100)}%{transform:translate(${r1(p.x)}px,${r1(p.y)}px) scale(${r2(s)});opacity:${r2(o)}}`;
    }
    ringCss += `@keyframes g${i}{${kf}}.g${i}{animation-name:g${i}}`;
    const n = Math.max(8, Math.round(26 * Math.cos(THREE.MathUtils.degToRad(lat))));
    for (let k = 0; k < n; k++) dots += `<circle r="2.1" class="d g${i}" style="animation-delay:-${r2((k / n) * DUR)}s"/>`;
  });

  // Arcos entre pontos de presença: o caminho muda a cada quadro (SMIL).
  // pontos espalhados pelos dois lados, para sempre haver arco visível
  const pops = [[-12, -30], [18, 25], [44, 85], [-38, 30], [6, 150], [-24, 95], [30, -100], [-20, -160], [55, -45]];
  const links = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 7], [7, 6], [6, 8], [8, 1]];
  const N = 12;
  let arcs = '';
  links.forEach(([ia, ib], j) => {
    const a = fromLatLon(...pops[ia]), b = fromLatLon(...pops[ib]);
    const ang = a.angleTo(b), lift = 0.12 + 0.2 * ang;
    const ds = [], ops = [];
    for (let f = 0; f <= F; f++) {
      atFrame(f);
      const pts = [];
      let mid = 0;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const v = new THREE.Vector3().copy(a).lerp(b, t).normalize().multiplyScalar(1 + lift * Math.sin(Math.PI * t));
        const p = project(v);
        if (k === N / 2) mid = p.z;
        pts.push(`${r1(p.x)} ${r1(p.y)}`);
      }
      ds.push('M' + pts.join('L'));
      ops.push(r2(0.05 + 0.95 * smooth(-0.15, 0.45, mid)));
    }
    arcs += `<path id="a${j}" d="${ds[0]}" pathLength="1" fill="none"><animate attributeName="d" dur="${DUR}s" repeatCount="indefinite" values="${ds.join(';')}"/><animate attributeName="opacity" dur="${DUR}s" repeatCount="indefinite" values="${ops.join(';')}"/></path>`;
  });
  const arcUses = links.map((_, j) =>
    `<use href="#a${j}" stroke="${T.amber}" stroke-width="1.3" stroke-opacity=".55" marker-start="url(#pop)" marker-end="url(#pop)"/>` +
    `<use href="#a${j}" class="pulse" stroke="#ffe2b0" stroke-width="2.4" stroke-linecap="round" stroke-dasharray=".16 1" style="animation-delay:${r2(1.6 + j * 0.7)}s;animation-duration:${r2(3.6 + (j % 3) * 0.9)}s"/>`).join('');

  // Tráfego de 24h: pico às 21h, como em provedor de verdade.
  const g = (h, mu, sd) => { const d = Math.min(Math.abs(h - mu), 24 - Math.abs(h - mu)); return Math.exp(-(d * d) / (2 * sd * sd)); };
  const X0 = 76, X1 = 576, Y0 = 392, Y1 = 338;
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const h = i / 2;
    const v = 0.14 + 0.2 * g(h, 11, 3) + 0.1 * g(h, 15, 2) + 0.62 * g(h, 21, 2.3) + (rnd() - 0.5) * 0.05;
    pts.push([X0 + (h / 24) * (X1 - X0), Y0 - Math.min(1, v) * (Y0 - Y1)]);
  }
  const line = smoothPath(pts);
  const area = `${line}L${X1} ${Y0}L${X0} ${Y0}Z`;
  const peakX = X0 + (21 / 24) * (X1 - X0);
  const peakY = Math.min(...pts.map((p) => p[1]));

  const typed = 'whoami'.split('').map((c, i) => `<tspan class="ch" style="animation-delay:${r2(0.5 + i * 0.09)}s">${c}</tspan>`).join('');
  const pills = [['NOC e observabilidade', T.green], ['web full stack', T.blue], ['IA local com RAG', T.amber]];
  let px = 56;
  const pillSvg = pills.map(([label, c], i) => {
    const w = label.length * 7.9 + 38;
    const s = `<g class="in" style="animation-delay:${r2(1.15 + i * 0.1)}s"><rect x="${px}" y="246" width="${w}" height="30" rx="15" fill="${c}" fill-opacity=".08" stroke="${c}" stroke-opacity=".45"/><circle cx="${px + 16}" cy="261" r="4" fill="${c}" class="led" style="animation-delay:${i * 0.8}s"/><text x="${px + 28}" y="266" class="mono" font-size="13" fill="${T.text}">${esc(label)}</text></g>`;
    px += w + 12;
    return s;
  }).join('');

  const css = `
    .ch{animation:ty .05s step-end both}@keyframes ty{from{fill-opacity:0}to{fill-opacity:1}}
    .d{animation-duration:${DUR}s;animation-timing-function:linear;animation-iteration-count:infinite;fill:${T.green}}
    ${ringCss}
    .globe{animation:globe 1.4s ${T.expoOut} .3s both;transform-origin:${CX}px ${CY}px}
    @keyframes globe{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
    .draw{stroke-dasharray:1;animation:draw 2.2s ${T.power3Out} 1.4s both}
    @keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    .fill{animation:fade 1.2s ease 2.6s both}@keyframes fade{from{opacity:0}}
    .grid{animation:fade 2s ease both}
    @media (prefers-reduced-motion:reduce){.d{animation-play-state:paused}.globe,.draw,.fill,.grid{animation:none}}`;

  const body = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.bg0}"/><stop offset="1" stop-color="${T.bg1}"/></linearGradient>
  <radialGradient id="atm" cx="${CX}" cy="${CY}" r="${R + 70}" gradientUnits="userSpaceOnUse"><stop offset=".68" stop-color="${T.green}" stop-opacity="0"/><stop offset=".74" stop-color="${T.green}" stop-opacity=".16"/><stop offset="1" stop-color="${T.green}" stop-opacity="0"/></radialGradient>
  <radialGradient id="body" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#12304b"/><stop offset="1" stop-color="#060f1c"/></radialGradient>
  <radialGradient id="glowL" cx=".2" cy=".1" r=".6"><stop offset="0" stop-color="${T.blue}" stop-opacity=".12"/><stop offset="1" stop-color="${T.blue}" stop-opacity="0"/></radialGradient>
  <linearGradient id="name" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9f3dc"/></linearGradient>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.green}" stop-opacity=".28"/><stop offset="1" stop-color="${T.green}" stop-opacity="0"/></linearGradient>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern>
  <marker id="pop" viewBox="-7 -7 14 14" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse"><circle r="5.5" fill="none" stroke="${T.amber}" stroke-opacity=".5"/><circle r="2.6" fill="${T.amber}"/></marker>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  ${arcs}
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" class="grid"/>
  <rect width="${W}" height="${H}" fill="url(#glowL)"/>

  <text x="56" y="29" class="mono" font-size="13" fill="${T.dim}">NOC · cristianprevot05-web</text>
  <text x="944" y="29" class="mono" font-size="13" fill="${T.muted}" text-anchor="end">todos os sistemas operando</text>
  <circle cx="${944 - 26 * 7.9 - 14}" cy="25" r="4" fill="${T.green}" class="led"/>
  <line x1="0" y1="46" x2="${W}" y2="46" stroke="${T.line}" stroke-opacity=".7"/>

  <text x="56" y="112" class="mono in" font-size="17" style="animation-delay:.2s"><tspan fill="${T.green}">cristian@noc</tspan><tspan fill="${T.dim}">:~$ </tspan><tspan fill="${T.text}">${typed}</tspan><tspan fill="${T.green}" class="blink"> ▋</tspan></text>
  <text x="54" y="180" class="sans in" font-size="60" font-weight="700" fill="url(#name)" letter-spacing="-1" style="animation-delay:.95s">Cristian Prevot</text>
  <text x="56" y="222" class="sans in" font-size="21" font-weight="300" fill="#a9bdd8" style="animation-delay:1.05s">Monitoramento de redes, desenvolvimento web e IA</text>
  ${pillSvg}

  <g class="in" style="animation-delay:1.35s">
    <rect x="56" y="300" width="536" height="108" rx="14" fill="${T.bg2}" fill-opacity=".7" stroke="${T.line}"/>
    <text x="76" y="324" class="mono" font-size="12" fill="${T.muted}">tráfego · últimas 24h</text>
    <text x="572" y="324" class="mono" font-size="12" fill="${T.amber}" text-anchor="end">pico às 21h</text>
  </g>
  <path d="${area}" fill="url(#area)" class="fill"/>
  <line x1="${r1(peakX)}" y1="${r1(peakY)}" x2="${r1(peakX)}" y2="${Y0}" stroke="${T.amber}" stroke-dasharray="2 4" stroke-opacity=".6" class="fill"/>
  <path id="spark" d="${line}" fill="none" stroke="${T.green}" stroke-width="2" pathLength="1" class="draw"/>
  <circle r="4" fill="#fff" filter="url(#soft)" class="moving" opacity="0"><set attributeName="opacity" to="1" begin="3.6s" fill="freeze"/><animateMotion dur="7s" begin="3.6s" repeatCount="indefinite"><mpath href="#spark"/></animateMotion></circle>

  <g class="globe">
    <circle cx="${CX}" cy="${CY}" r="${R + 70}" fill="url(#atm)"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#body)" stroke="#1e4a6e" stroke-opacity=".8"/>
    <g>${dots}</g>
    <g class="moving" fill="none" filter="url(#soft)">${arcUses}</g>
  </g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${T.line}"/>`;

  save('topo.svg', svg(W, H, 'Cristian Prevot. Monitoramento de redes, desenvolvimento web e IA. À direita, um globo de pontos gira com conexões entre pontos de presença; embaixo, um gráfico de tráfego de 24 horas com pico às 21h.', css, body));
}

// ── 2. Títulos de seção ────────────────────────────────────────────
function titulo(file, label, idx) {
  const W = 1000, H = 60;
  const tw = 22 + label.length * 12.2;
  const css = `.pulse{animation-duration:5s}`;
  const body = `<defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.line}"/><stop offset="1" stop-color="${T.line}" stop-opacity="0"/></linearGradient></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${T.bg1}" stroke="${T.line}"/>
<rect x="20" y="17" width="4" height="26" rx="2" fill="${T.green}"/>
<circle cx="22" cy="30" r="9" fill="${T.green}" fill-opacity=".18" class="led"/>
<text x="40" y="38" class="sans in" font-size="22" font-weight="600" fill="${T.text}">${esc(label)}</text>
<path d="M${r1(40 + tw)} 30H930" stroke="url(#f)" stroke-dasharray="2 5"/>
<path d="M${r1(40 + tw)} 30H930" pathLength="1" stroke="${T.amber}" stroke-width="2" stroke-linecap="round" stroke-dasharray=".16 1" class="pulse" style="animation-delay:${idx * 0.6}s"/>
<text x="978" y="35" class="mono" font-size="13" fill="${T.dim}" text-anchor="end">${String(idx).padStart(2, '0')}</text>`;
  save(file, svg(W, H, label, css, body));
}

// ── 3. Cartões de projeto ──────────────────────────────────────────
function card(file, { repo, title, lines, tags, viz, privado }) {
  const W = 500, H = 280;
  let x = 28;
  const chips = tags.map((t) => {
    const w = t.length * 8.2 + 20;
    const s = `<rect x="${x}" y="218" width="${w}" height="30" rx="8" fill="${T.bg2}" stroke="${T.line}"/><text x="${x + 10}" y="238" class="mono" font-size="13.5" fill="${T.muted}">${esc(t)}</text>`;
    x += w + 8;
    return s;
  }).join('');
  const text = lines.map((l, i) => `<tspan x="28" dy="${i ? 26 : 0}">${esc(l)}</tspan>`).join('');
  const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${T.bg1}" stroke="${T.line}"/>
<path d="M28 30h10l3 4h13v14H28z" fill="none" stroke="${T.dim}" stroke-width="1.5" stroke-linejoin="round"/>
<text x="64" y="44" class="mono" font-size="13" fill="${T.muted}">${esc(repo)}</text>
${viz}
<text x="28" y="100" class="sans in" font-size="26" font-weight="700" fill="${T.text}">${esc(title)}</text>
<text x="28" y="136" class="sans in" font-size="17.5" fill="#b4c4da" style="animation-delay:.12s">${text}</text>
<g class="in" style="animation-delay:.24s">${chips}</g>
${privado
    ? `<rect x="394" y="229" width="12" height="10" rx="2" fill="${T.amber}"/><path d="M396.5 229v-3.2a3.5 3.5 0 0 1 7 0v3.2" fill="none" stroke="${T.amber}" stroke-width="1.7"/><text x="472" y="238" class="mono" font-size="14" fill="${T.amber}" text-anchor="end">privado</text>`
    : `<text x="472" y="238" class="mono" font-size="14" fill="${T.green}" text-anchor="end">ver código →</text>`}`;
  const css = `
    .dot{animation:hop 1.2s ${T.power3Out} infinite}@keyframes hop{0%,60%,100%{transform:none;opacity:.45}30%{transform:translateY(-5px);opacity:1}}
    .bar{transform-box:fill-box;transform-origin:bottom;animation:bar 2.6s ease-in-out infinite}
    @keyframes bar{0%,100%{transform:scaleY(.45)}50%{transform:scaleY(1)}}
    @media (prefers-reduced-motion:reduce){.dot,.bar{animation:none}}`;
  save(file, svg(W, H, `${title}. ${lines.join(' ')} Tecnologias: ${tags.join(', ')}.`, css, body));
}

const chatViz = `<g transform="translate(398 22)"><rect width="74" height="40" rx="12" fill="${T.bg2}" stroke="${T.line}"/><path d="M14 40l-4 9 12-9" fill="${T.bg2}" stroke="${T.line}"/><path d="M13 39.5h10" stroke="${T.bg2}" stroke-width="2"/>
${[0, 1, 2].map((i) => `<circle cx="${23 + i * 14}" cy="20" r="4" fill="${T.amber}" class="dot" style="animation-delay:${i * 0.15}s"/>`).join('')}</g>`;
const barsViz = `<g transform="translate(398 18)"><rect width="74" height="48" rx="10" fill="${T.bg2}" stroke="${T.line}"/>
${[0, 1, 2, 3, 4].map((i) => `<rect x="${12 + i * 11}" y="12" width="6" height="26" rx="2" fill="${i === 3 ? T.amber : T.green}" class="bar" style="animation-delay:-${r2(i * 0.45)}s;animation-duration:${r2(2 + (i % 3) * 0.5)}s"/>`).join('')}</g>`;

const nocViz = `<g transform="translate(398 18)"><rect width="74" height="48" rx="10" fill="${T.bg2}" stroke="${T.line}"/>
${[[T.amber, 30], [T.green, 40], [T.green, 24]].map(([c, w], i) => `<circle cx="13" cy="${13 + i * 11}" r="3" fill="${c}" class="led" style="animation-duration:${c === T.amber ? 0.9 : 2.6}s"/><rect x="22" y="${11 + i * 11}" width="${w}" height="4" rx="2" fill="${T.muted}" fill-opacity=".4"/>`).join('')}</g>`;
const agendaViz = `<g transform="translate(398 18)"><rect width="74" height="48" rx="10" fill="${T.bg2}" stroke="${T.line}"/>
${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${11 + (i % 4) * 14}" y="${11 + Math.floor(i / 4) * 14}" width="10" height="10" rx="2.5" fill="${i === 5 ? T.amber : T.muted}" fill-opacity="${i === 5 ? 1 : 0.25}"${i === 5 ? ' class="led" style="animation-duration:1.6s"' : ''}/>`).join('')}</g>`;

// ── 4. Stack em forma de switch de rede ────────────────────────────
function stack() {
  const W = 1000, H = 290;
  const ports = [
    ['python', 'Python'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['react', 'React'],
    ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind'], ['threedotjs', 'Three.js'], ['nodedotjs', 'Node.js'],
    ['supabase', 'Supabase'], ['postgresql', 'PostgreSQL'], ['zabbix', 'Zabbix'], ['grafana', 'Grafana'],
    ['html5', 'HTML'], ['css', 'CSS'], ['vercel', 'Vercel'], ['git', 'Git'],
  ];
  const colW = 113, x0 = 48, y0 = 72;
  const mods = ports.map(([slug, label], i) => {
    const c = i % 8, r = Math.floor(i / 8);
    const x = x0 + c * colW, y = y0 + r * 102;
    const amber = i === 10 || i === 3;
    return `<g class="in" style="animation-delay:${r2(0.2 + i * 0.05)}s">
  <rect x="${x}" y="${y}" width="${colW - 12}" height="90" rx="10" fill="${T.bg1}" stroke="${T.line}"/>
  <circle cx="${x + colW - 26}" cy="${y + 13}" r="3.2" fill="${amber ? T.amber : T.green}" class="led" style="animation-duration:${r2(0.9 + rnd() * 2.2)}s;animation-delay:-${r2(rnd() * 2)}s"/>
  ${icon(slug, x + (colW - 12) / 2 - 15, y + 18, 30)}
  <text x="${x + (colW - 12) / 2}" y="${y + 75}" class="mono" font-size="13" fill="${T.muted}" text-anchor="middle">${esc(label)}</text></g>`;
  }).join('\n');
  const screws = [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="5" fill="${T.bg0}" stroke="${T.line}"/><path d="M${cx - 3} ${cy}h6" stroke="${T.dim}"/>`).join('');
  const body = `<defs><linearGradient id="ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1c31"/><stop offset="1" stop-color="${T.bg0}"/></linearGradient></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="url(#ch)" stroke="${T.line}"/>
${screws}
<rect x="48" y="26" width="58" height="24" rx="6" fill="${T.green}" fill-opacity=".12" stroke="${T.green}" stroke-opacity=".5"/>
<text x="77" y="43" class="mono" font-size="13" fill="${T.green}" text-anchor="middle">SW-01</text>
<text x="118" y="43" class="mono" font-size="13" fill="${T.muted}">ferramentas do dia a dia</text>
<text x="946" y="43" class="mono" font-size="13" fill="${T.muted}" text-anchor="end">16/16 portas ativas</text>
${mods}`;
  save('stack.svg', svg(W, H, `Ferramentas do dia a dia: ${ports.map((p) => p[1]).join(', ')}.`, '', body));
}

// ── 5. Rodapé ──────────────────────────────────────────────────────
function rodape() {
  const W = 1000, H = 110;
  const body = `<path d="M60 40H940" stroke="${T.line}" stroke-dasharray="2 5"/>
<path d="M60 40H940" pathLength="1" stroke="${T.green}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray=".12 1" class="pulse"/>
<path d="M940 40H60" pathLength="1" stroke="${T.amber}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray=".08 1" class="pulse" style="animation-delay:2.2s;animation-duration:6s"/>
<circle cx="60" cy="40" r="6" fill="${T.bg1}" stroke="${T.green}"/><circle cx="940" cy="40" r="6" fill="${T.bg1}" stroke="${T.amber}"/>
<text x="500" y="88" class="mono" font-size="14" fill="${T.muted}" text-anchor="middle">obrigado pela visita · conexão encerrada sem perda de pacotes</text>`;
  save('rodape.svg', svg(W, H, 'Obrigado pela visita.', '', body));
}

topo();
titulo('titulo-sobre-mim.svg', 'sobre mim', 1);
titulo('titulo-projetos.svg', 'projetos em destaque', 2);
titulo('titulo-stack.svg', 'stack', 3);
titulo('titulo-atividade.svg', 'atividade', 4);
card('card-central-noc.svg', {
  repo: 'central-noc', title: 'Central NOC do provedor', privado: true,
  lines: ['Incidentes agrupados por causa e por clientes', 'afetados, com dados do Zabbix, NetBox, LibreNMS', 'e IXC. Roda até na TV do NOC, com 58 testes.'],
  tags: ['JavaScript', 'Node.js', 'Zabbix', 'NetBox'], viz: nocViz,
});
card('card-central-comunicados.svg', {
  repo: 'central-de-comunicados', title: 'Central de Comunicados', privado: true,
  lines: ['Monta o aviso de rompimento ou manutenção no', 'modelo oficial, passa por aprovação e publica no', 'Instagram na hora ou agendado, com log imutável.'],
  tags: ['JavaScript', 'PHP', 'Supabase', 'Web Push'], viz: agendaViz,
});
card('card-agente-ia.svg', {
  repo: 'agente-de-ia', title: 'Agente de IA para o suporte', privado: true,
  lines: ['Supervisor técnico que faz a triagem das ordens', 'de serviço do ERP IXC e acha a resposta certa nos', 'manuais. Roda local, com temperatura 0.'],
  tags: ['Python', 'Streamlit', 'RAG', 'LM Studio'], viz: chatViz,
});
card('card-monitoramento.svg', {
  repo: 'monitoramento-de-redes', title: 'Monitoramento de OLTs',
  lines: ['Painel no Grafana com os dados do Zabbix para', 'acompanhar as OLTs do provedor, mais um alerta', 'de OS duplicada de reparo de CTO vinda do IXC.'],
  tags: ['Zabbix', 'Grafana', 'JavaScript', 'IXC'], viz: barsViz,
});
stack();
rodape();
