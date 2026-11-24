const { chromium } = require('playwright');
// Plain grey mannequin silhouettes: no features, no style. Same 200-unit layout as the game.
const bust = (shoulder) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#d9d9d9"/>
<g fill="#9a9a9a">
<path d="M${100 - shoulder} 200 C${102 - shoulder} 176 ${120 - shoulder} 162 80 156 L86 140 L114 140 L120 156 C${80 + shoulder} 162 ${98 + shoulder} 176 ${100 + shoulder} 200Z"/>
<ellipse cx="57" cy="104" rx="7" ry="11"/><ellipse cx="143" cy="104" rx="7" ry="11"/>
<path d="M100 46 C130 46 142 72 142 100 C142 132 126 156 100 158 C74 156 58 132 58 100 C58 72 70 46 100 46Z"/>
</g></svg>`;
const guide = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#d9d9d9"/>
<path d="M100 46 C130 46 142 72 142 100 C142 132 126 156 100 158 C74 156 58 132 58 100 C58 72 70 46 100 46Z" fill="#b8b8b8"/>
${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="200" stroke="#777" stroke-width="${i % 5 ? .15 : .4}"/><line x1="0" y1="${i * 10}" x2="200" y2="${i * 10}" stroke="#777" stroke-width="${i % 5 ? .15 : .4}"/>`).join('')}
<g font-family="Arial" font-size="4.2" stroke-width=".7">
<line x1="40" y1="46" x2="160" y2="46" stroke="#d64"/><text x="146" y="44" fill="#d64">top of skull</text>
<line x1="40" y1="70" x2="160" y2="70" stroke="#a6c"/><text x="146" y="68" fill="#a6c">hairline</text>
<line x1="40" y1="89" x2="160" y2="89" stroke="#c90"/><text x="146" y="87" fill="#c90">brows</text>
<line x1="40" y1="102" x2="160" y2="102" stroke="#08a"/><text x="146" y="100" fill="#08a">eye line</text>
<circle cx="83" cy="102" r="1.5" fill="#08a"/><circle cx="117" cy="102" r="1.5" fill="#08a"/>
<line x1="40" y1="118" x2="160" y2="118" stroke="#c90"/><text x="146" y="116" fill="#c90">nose tip</text>
<line x1="40" y1="134" x2="160" y2="134" stroke="#d46"/><text x="146" y="132" fill="#d46">mouth</text>
<line x1="40" y1="158" x2="160" y2="158" stroke="#d64"/><text x="146" y="156" fill="#d64">chin</text>
<line x1="100" y1="30" x2="100" y2="190" stroke="#555" stroke-dasharray="2 2"/><text x="102" y="188" fill="#555">centre line</text>
</g></svg>`;
(async () => { const b = await chromium.launch();
  for (const [svg, out] of [[bust(80), 'face-template-atp.png'], [bust(72), 'face-template-wta.png'], [guide, 'face-layer-guide.png']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 1024 } }); await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.screenshot({ path: `docs/art-templates/${out}` }); await p.close(); }
  await b.close(); })();
