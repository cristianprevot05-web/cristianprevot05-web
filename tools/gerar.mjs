// Gera os SVGs do perfil em ../assets. Uso: npm run assets
// O GitHub não roda JS no README: o Three.js calcula o globo aqui e o movimento
// vira keyframes CSS dentro do SVG. O texto vira contorno (opentype.js) para
// sair igual em qualquer sistema.
import * as THREE from 'three';
import * as si from 'simple-icons';
import opentype from 'opentype.js';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// Direção: papel, tinta e um único amarelo, o do cordão de fibra monomodo.
const T = {
  paper: '#f3efe6', ink: '#151412', inkSoft: '#5b574f', hair: '#d8d1c2', accent: '#f2c230',
  expoOut: 'cubic-bezier(.16,1,.3,1)', // GSAP expo.out
  power3Out: 'cubic-bezier(.215,.61,.355,1)', // GSAP power3.out
};

const face = (w) => {
  const b = readFileSync(new URL(`../node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-${w}-normal.woff`, import.meta.url));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const F = { regular: face(400), heavy: face(900), bold: face(800) };

// Texto em contorno. anchor: start | middle | end. ls em em.
function text(f, s, x, y, size, { anchor = 'start', ls = 0 } = {}) {
  const o = { kerning: true, letterSpacing: ls };
  const w = f.getAdvanceWidth(s, size, o);
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  return { d: f.getPath(s, x0, y, size, o).toPathData(1), w };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const svg = (w, h, label, css, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<style>${css}</style>
${body}
</svg>\n`;
const save = (name, s) => { writeFileSync(new URL(name, OUT), s); console.log(name, (s.length / 1024).toFixed(1) + 'KB'); };

// ── Topo: globo em meio-tom sobre o círculo amarelo, título grande ──
function topo() {
  const W = 1000, H = 560, CX = 515, CY = 292, R = 178, DUR = 48, F_ = 48;
  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  cam.position.set(0, 0, 6); cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const tilt = new THREE.Group(); tilt.rotation.set(0.38, 0, -0.16);
  const spin = new THREE.Group(); tilt.add(spin);
  const scale = R / ((1 / Math.sqrt(35)) / Math.tan(THREE.MathUtils.degToRad(17.5)));
  const project = (v) => {
    const w = v.clone().applyMatrix4(spin.matrixWorld);
    const p = w.clone().project(cam);
    return { x: CX + p.x * scale, y: CY - p.y * scale, z: w.z };
  };

  // Um clipe de keyframes por anel de latitude; cada ponto toca o mesmo clipe
  // com atraso negativo (como AnimationAction.time no Three.js).
  let ringCss = '', dots = '';
  [-78, -65, -52, -39, -26, -13, 0, 13, 26, 39, 52, 65, 78].forEach((lat, i) => {
    const a = THREE.MathUtils.degToRad(lat);
    let kf = '';
    for (let f = 0; f <= F_; f++) {
      spin.rotation.y = (2 * Math.PI * f) / F_; tilt.updateMatrixWorld(true);
      const p = project(new THREE.Vector3(0, Math.sin(a), Math.cos(a)));
      const o = 0.1 + 0.9 * smooth(-0.15, 0.4, p.z);
      const s = 0.5 + 0.7 * ((p.z + 1) / 2);
      kf += `${r2((f / F_) * 100)}%{transform:translate(${r1(p.x)}px,${r1(p.y)}px) scale(${r2(s)});opacity:${r2(o)}}`;
    }
    ringCss += `@keyframes g${i}{${kf}}.g${i}{animation-name:g${i}}`;
    const n = Math.max(6, Math.round(40 * Math.cos(a)));
    for (let k = 0; k < n; k++) dots += `<circle r="2.5" class="d g${i}" style="animation-delay:-${r2((k / n) * DUR)}s"/>`;
  });

  const mark = text(F.bold, 'cristian prevot.', 56, 74, 26, { ls: -0.02 });
  const lines = ['antes da', 'ligação do', 'cliente.'].map((s, i) => text(F.heavy, s, 944, 250 + i * 96, 100, { anchor: 'end', ls: -0.045 }));
  const lede = ['Monitoro a rede de um provedor', 'e escrevo as ferramentas que faltam.'].map((s, i) => text(F.regular, s, 56, 438 + i * 28, 19));
  const place = text(F.regular, 'Rio de Janeiro', 944, 520, 15, { anchor: 'end' });

  const css = `
    .d{fill:${T.ink};animation-duration:${DUR}s;animation-timing-function:linear;animation-iteration-count:infinite}
    ${ringCss}
    .circle{transform-origin:${CX - 50}px ${CY + 10}px;animation:grow 1.3s ${T.expoOut} .1s both}
    @keyframes grow{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
    .globe{animation:fade 1.4s ease .5s both}
    .rise{animation:rise 1.1s ${T.expoOut} both}
    @keyframes rise{from{transform:translateY(28px);opacity:0}to{transform:none;opacity:1}}
    @keyframes fade{from{opacity:0}}
    @media (prefers-reduced-motion:reduce){.d{animation-play-state:paused}.circle,.globe,.rise{animation:none}}`;

  const body = `<rect width="${W}" height="${H}" rx="10" fill="${T.paper}"/>
<path class="rise" d="${mark.d}" fill="${T.ink}"/>
<circle class="circle" cx="${CX - 50}" cy="${CY + 10}" r="205" fill="${T.accent}"/>
<g class="globe">${dots}</g>
${lines.map((l, i) => `<path class="rise" style="animation-delay:${r2(0.35 + i * 0.12)}s" d="${l.d}" fill="${T.ink}" stroke="${T.paper}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`).join('\n')}
${lede.map((l, i) => `<path class="rise" style="animation-delay:${r2(0.8 + i * 0.08)}s" d="${l.d}" fill="${T.ink}"/>`).join('\n')}
<path d="${place.d}" fill="${T.inkSoft}"/>`;

  save('topo.svg', svg(W, H, 'Cristian Prevot. Antes da ligação do cliente. Monitoro a rede de um provedor e escrevo as ferramentas que faltam. Rio de Janeiro. Um globo de pontos gira sobre um círculo amarelo.', css, body));
}

// ── Ferramentas: os logos em tinta, sem caixas ──
function ferramentas() {
  const W = 1000, H = 236;
  const tools = [
    ['python', 'Python'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['react', 'React'],
    ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind'], ['threedotjs', 'Three.js'], ['nodedotjs', 'Node.js'],
    ['supabase', 'Supabase'], ['postgresql', 'PostgreSQL'], ['zabbix', 'Zabbix'], ['grafana', 'Grafana'],
    ['php', 'PHP'], ['streamlit', 'Streamlit'], ['vercel', 'Vercel'], ['git', 'Git'],
  ];
  const col = 110, x0 = (W - 8 * col) / 2;
  const items = tools.map(([slug, label], i) => {
    const cx = x0 + (i % 8) * col + col / 2, y = 34 + Math.floor(i / 8) * 100;
    const ic = slug === 'zabbix'
      ? `<rect x="${cx - 15}" y="${y}" width="30" height="30" rx="4" fill="${T.ink}"/><path d="${text(F.heavy, 'Z', cx, y + 23, 22, { anchor: 'middle' }).d}" fill="${T.paper}"/>`
      : `<path transform="translate(${cx - 15} ${y}) scale(${30 / 24})" fill="${T.ink}" d="${si['si' + slug[0].toUpperCase() + slug.slice(1)].path}"/>`;
    return `<g class="rise" style="animation-delay:${r2(0.05 * i)}s">${ic}<path d="${text(F.regular, label, cx, y + 56, 14, { anchor: 'middle' }).d}" fill="${T.inkSoft}"/></g>`;
  }).join('\n');
  const css = `.rise{animation:rise .9s ${T.power3Out} both}@keyframes rise{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
    @media (prefers-reduced-motion:reduce){.rise{animation:none}}`;
  save('ferramentas.svg', svg(W, H, `Ferramentas: ${tools.map((t) => t[1]).join(', ')}.`, css, `<rect width="${W}" height="${H}" rx="10" fill="${T.paper}"/>\n${items}`));
}

topo();
ferramentas();
