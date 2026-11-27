// Gera os SVGs do perfil em ../assets. Uso: npm run assets
// Métricas (precisa de GITHUB_TOKEN, roda no Actions): node tools/gerar.mjs metricas <pasta>
// O GitHub não roda JS no README: o Three.js calcula o globo aqui e o movimento
// vira keyframes CSS dentro do SVG. O texto vira contorno (opentype.js) para
// sair igual em qualquer sistema.
import * as THREE from 'three';
import * as si from 'simple-icons';
import opentype from 'opentype.js';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [MODE = 'assets', DIR] = process.argv.slice(2);
const OUT = DIR ? pathToFileURL(resolve(DIR) + '/') : new URL('../assets/', import.meta.url);
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

// ── Retrato: a foto num círculo sobre o mesmo círculo amarelo do topo, fundo transparente ──
function retrato() {
  const W = 420, H = 400;
  const foto = readFileSync(new URL('../assets/retrato.jpg', import.meta.url)).toString('base64');
  const css = `
    .circle{transform-origin:165px 235px;animation:grow 1.3s ${T.expoOut} .1s both}
    .foto{animation:rise 1.1s ${T.expoOut} .35s both}
    @keyframes grow{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
    @keyframes rise{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
    @media (prefers-reduced-motion:reduce){.circle,.foto{animation:none}}`;
  const body = `<defs><clipPath id="c"><circle cx="240" cy="180" r="150"/></clipPath></defs>
<circle class="circle" cx="165" cy="235" r="150" fill="${T.accent}"/>
<g class="foto"><circle cx="240" cy="180" r="153" fill="${T.paper}"/><image href="data:image/jpeg;base64,${foto}" x="90" y="30" width="300" height="300" clip-path="url(#c)"/></g>`;
  save('retrato.svg', svg(W, H, 'Retrato de Cristian Prevot sobre um círculo amarelo.', css, body));
}

// ── Métricas: calendário isométrico e números do último ano, com dados reais da API ──
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');

async function metricas(login) {
  const query = `query($login: String!) { user(login: $login) {
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount weekday } } } }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) { totalCount nodes {
      languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'perfil-metricas' },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const u = (await res.json()).data?.user;
  if (!u) throw new Error(`GraphQL sem dados (HTTP ${res.status})`);

  const cal = u.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const max = Math.max(1, ...days.map((d) => d.contributionCount));
  let best = 0, run = 0, cur = 0;
  for (const d of days) { run = d.contributionCount ? run + 1 : 0; best = Math.max(best, run); }
  // A sequência atual termina hoje, ou ontem se hoje ainda está zerado.
  for (let i = days.length - (days.at(-1).contributionCount ? 1 : 2); i >= 0 && days[i].contributionCount; i--) cur++;
  const top = days.reduce((a, d) => (d.contributionCount > a.contributionCount ? d : a));
  const wk = [0, 0, 0, 0, 0, 0, 0];
  days.forEach((d) => { wk[d.weekday] += d.contributionCount; });
  const lang = {};
  for (const r of u.repositories.nodes) for (const e of r.languages.edges) lang[e.node.name] = (lang[e.node.name] || 0) + e.size;
  const ltot = Object.values(lang).reduce((a, b) => a + b, 0) || 1;
  let langs = Object.entries(lang).sort((a, b) => b[1] - a[1]);
  if (langs.length > 5) langs = [...langs.slice(0, 4), ['Outras', langs.slice(4).reduce((a, l) => a + l[1], 0)]];

  const W = 1000, H = 576;
  // Isometria: semana anda para a direita e para baixo, dia da semana para a esquerda e para baixo.
  const s = 10.2, a = s * Math.cos(Math.PI / 6), b = s / 2, ox = 105, oy = 84, g = 0.1;
  const P = (w, d, z) => `${r1(ox + (w - d) * a)},${r1(oy + (w + d) * b - z)}`;
  const tops = [T.paper === '#f3efe6' ? '#e4ddcf' : T.hair, '#f7e3a1', '#f2cf63', T.accent, '#c99700'];
  const cols = cal.weeks.map((wd, w) => {
    const boxes = wd.contributionDays.map((day) => {
      const c = day.contributionCount, d = day.weekday;
      const lvl = c ? Math.min(4, Math.ceil((4 * c) / max)) : 0;
      const h = c ? 4 + 34 * Math.sqrt(c / max) : 1.4;
      const [w0, w1, d0, d1] = [w + g, w + 1 - g, d + g, d + 1 - g], t = tops[lvl];
      // Dia sem contribuição vira só o losango de cima: as laterais teriam 1px e pesam no arquivo.
      if (!c) return `<path fill="${shade(t, 0.9)}" d="M${P(w0, d0, 0)}L${P(w1, d0, 0)}L${P(w1, d1, 0)}L${P(w0, d1, 0)}Z"/>`;
      return `<path fill="${shade(t, 0.86)}" d="M${P(w0, d1, 0)}L${P(w1, d1, 0)}L${P(w1, d1, h)}L${P(w0, d1, h)}Z"/>`
        + `<path fill="${shade(t, 0.74)}" d="M${P(w1, d0, 0)}L${P(w1, d1, 0)}L${P(w1, d1, h)}L${P(w1, d0, h)}Z"/>`
        + `<path fill="${t}" d="M${P(w0, d0, h)}L${P(w1, d0, h)}L${P(w1, d1, h)}L${P(w0, d1, h)}Z"/>`;
    }).join('');
    return `<g class="col" style="animation-delay:${r2(0.1 + w * 0.018)}s">${boxes}</g>`;
  }).join('\n');

  const paths = [];
  const put = (f, str, x, y, size, o = {}, fill = T.ink) => { paths.push(`<path d="${text(f, str, x, y, size, o).d}" fill="${fill}"/>`); };
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const [yy, mm, dd] = top.date.split('-');

  // Coluna da direita: o total e as linhas.
  const RX = 640, RR = 960;
  put(F.heavy, String(cal.totalContributions), RX, 112, 76, { ls: -0.04 });
  put(F.regular, 'contribuições no último ano', RX, 142, 17, {}, T.inkSoft);
  const rows = [
    ['sequência atual', plural(cur, 'dia', 'dias')],
    ['maior sequência', plural(best, 'dia', 'dias')],
    ['melhor dia', top.contributionCount ? `${top.contributionCount} em ${dd}/${mm}/${yy}` : 'nenhum ainda'],
    ['repositórios públicos', String(u.repositories.totalCount)],
  ];
  const lines = rows.map(([k, v], i) => {
    const y = 196 + i * 46;
    put(F.regular, k, RX, y, 16, {}, T.inkSoft);
    put(F.bold, v, RR, y, 17, { anchor: 'end' });
    return `<rect x="${RX}" y="${y - 30}" width="${RR - RX}" height="1" fill="${T.hair}"/>`;
  }).join('');

  // Embaixo: dias da semana e linguagens.
  put(F.bold, 'por dia da semana', 40, 446, 16);
  const wmax = Math.max(1, ...wk);
  const bars = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((n, i) => {
    const x = 40 + i * 74, bh = wk[i] ? Math.max(3, (wk[i] / wmax) * 52) : 1;
    put(F.regular, n, x + 22, 546, 14, { anchor: 'middle' }, T.inkSoft);
    if (wk[i]) put(F.bold, String(wk[i]), x + 22, 520 - bh - 7, 13, { anchor: 'middle' });
    return `<rect class="bar" style="animation-delay:${r2(1 + i * 0.06)}s" x="${x + 4}" y="${520 - bh}" width="36" height="${r1(bh)}" rx="2" fill="${wk[i] === wmax ? T.ink : T.accent}"/>`;
  }).join('');
  put(F.bold, 'linguagens', RX, 446, 16);
  const swatch = [T.ink, T.accent, T.inkSoft, '#c99700', T.hair];
  let lx = RX;
  const seg = langs.map(([n, v], i) => {
    const w = ((RR - RX) * v) / ltot, x = lx; lx += w;
    const cx = RX + (i % 2) * 170, cy = 500 + Math.floor(i / 2) * 24;
    put(F.regular, `${n} ${Math.round((100 * v) / ltot)}%`, cx + 20, cy, 14, {}, T.ink);
    return `<rect class="seg" style="animation-delay:${r2(1.1 + i * 0.08)}s" x="${r1(x)}" y="462" width="${r1(Math.max(1, w - 2))}" height="12" fill="${swatch[i]}"/>`
      + `<rect x="${cx}" y="${cy - 11}" width="12" height="12" rx="2" fill="${swatch[i]}"/>`;
  }).join('');

  const css = `
    .col{animation:rise .9s ${T.expoOut} both}
    .bar{transform-box:fill-box;transform-origin:50% 100%;animation:up .8s ${T.power3Out} both}
    .seg{transform-box:fill-box;transform-origin:0 50%;animation:out .9s ${T.expoOut} both}
    @keyframes rise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
    @keyframes up{from{transform:scaleY(0)}}
    @keyframes out{from{transform:scaleX(0)}}
    @media (prefers-reduced-motion:reduce){.col,.bar,.seg{animation:none}}`;
  const label = `${cal.totalContributions} contribuições no último ano, sequência atual de ${plural(cur, 'dia', 'dias')} e maior de ${plural(best, 'dia', 'dias')}. `
    + `Linguagens: ${langs.map(([n, v]) => `${n} ${Math.round((100 * v) / ltot)}%`).join(', ')}.`;
  save('metricas.svg', svg(W, H, label, css, `<rect width="${W}" height="${H}" rx="10" fill="${T.paper}"/>\n${cols}\n${lines}${bars}${seg}\n${paths.join('\n')}`));
}

if (MODE === 'metricas') await metricas('cristianprevot05-web');
else { topo(); ferramentas(); retrato(); }
