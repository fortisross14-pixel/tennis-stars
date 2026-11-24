const { chromium } = require('playwright');
// Placement guides for the realistic face pieces (docs/ART_BRIEF.md §2.1): plain grey mannequins, no features, no style.
// 1024 px canvas drawn in a 200-unit box (1 unit = 5.12 px): skull top y 170 px, eye line 400, chin 700, pupils x 437 / 587.
const head = (jaw) => `M100 33 C124 33 138 48 138 72 C138 86 137 94 135 104 C132 118 ${100 + jaw + 4} 128 ${100 + jaw} 132 Q100 140 ${100 - jaw} 132 C${100 - jaw - 4} 128 68 118 65 104 C63 94 62 86 62 72 C62 48 76 33 100 33Z`;
const bust = (shoulder, jaw) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#d9d9d9"/>
<g fill="#9a9a9a">
<path d="M${100 - shoulder} 200 C${102 - shoulder} 168 ${118 - shoulder} 156 82 150 L86 124 L114 124 L118 150 C${82 + shoulder} 156 ${98 + shoulder} 168 ${100 + shoulder} 200Z"/>
<ellipse cx="61" cy="86" rx="5.5" ry="12"/><ellipse cx="139" cy="86" rx="5.5" ry="12"/>
<path d="${head(jaw)}"/>
</g></svg>`;
const lines = [[33, 'top of skull', '#d64'], [53, 'hairline', '#a6c'], [69, 'brows', '#c90'], [78, 'eye line', '#08a'], [102, 'nose base', '#c90'], [115, 'mouth', '#d46'], [137, 'chin', '#d64']];
const guide = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#d9d9d9"/>
<path d="${head(14)}" fill="#b8b8b8"/>
${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="200" stroke="#777" stroke-width="${i % 5 ? .15 : .4}"/><line x1="0" y1="${i * 10}" x2="200" y2="${i * 10}" stroke="#777" stroke-width="${i % 5 ? .15 : .4}"/>`).join('')}
<g font-family="Arial" font-size="4.2" stroke-width=".7">
${lines.map(([y, t, c]) => `<line x1="40" y1="${y}" x2="160" y2="${y}" stroke="${c}"/><text x="143" y="${y - 1.5}" fill="${c}">${t}</text>`).join('')}
<circle cx="85.4" cy="78" r="1.5" fill="#08a"/><circle cx="114.6" cy="78" r="1.5" fill="#08a"/>
<line x1="100" y1="20" x2="100" y2="195" stroke="#555" stroke-dasharray="2 2"/><text x="102" y="192" fill="#555">centre line</text>
</g></svg>`;
(async () => { const b = await chromium.launch();
  for (const [svg, out] of [[bust(84, 16), 'face-template-atp.png'], [bust(74, 12), 'face-template-wta.png'], [guide, 'face-layer-guide.png']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 1024 } }); await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.screenshot({ path: `docs/art-templates/${out}` }); await p.close(); }
  await b.close(); })();
