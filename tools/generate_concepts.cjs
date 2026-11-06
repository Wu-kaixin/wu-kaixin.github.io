// Concept illustrations adapted from the user’s unpublished Sites draft.
// Generated positions are explanatory, not experimental results.
const fs = require('node:fs');
const path = require('node:path');
let language = 'zh';
const word = (zh,en) => language === 'zh' ? zh : en;
function diagram(type, prefix, miniature = false) {
  const purple = '#7575ad';
  const green = '#768763';
  const color = type === 'transport' ? purple : green;
  const guides = type === 'transport'
    ? [[195,120],[278,85],[365,122],[447,196],[459,282],[378,353],[274,369],[202,316],[170,228]]
    : [[189,135],[278,91],[376,109],[449,168],[468,244],[429,320],[350,365],[251,356],[177,307],[146,229]];
  const grid = `<defs><pattern id="${prefix}-grid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="${miniature ? '#b7bbc0' : '#b1b8a9'}" opacity=".48"/></pattern><marker id="${prefix}-arrow" viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="m1 1 6 3-6 3" fill="none" stroke="${color}" stroke-width="1.3"/></marker></defs><rect x="30" y="25" width="560" height="390" fill="url(#${prefix}-grid)"/>`;
  let object;
  if (type === 'transport') {
    object = `<path d="M206 136 329 111 355 181 415 192 425 309 243 330 199 246Z" fill="#d6d7eb" stroke="${purple}" stroke-width="1.5"/>
      <path d="M206 136 329 111 355 181 415 192 425 309 243 330 199 246Z" transform="translate(5 7)" fill="#9498ba" opacity=".08"/>
      <path d="m215 146 106-23 25 68 58 12 9 97-162 18-40-76Z" fill="none" stroke="#a7a8ca" stroke-width="1" stroke-dasharray="3 5"/>
      <path d="m300 238h20m-10-10v20" stroke="#9293b6" stroke-width="1"/><circle cx="310" cy="238" r="3" fill="#797da7"/>
      <text x="310" y="269" text-anchor="middle" font-size="11" fill="#777aa0" class="figure-label">${word('未知形状物体','Unknown object')}</text>
      <path d="M449 124 502 79" fill="none" stroke="${purple}" stroke-width="1.5" marker-end="url(#${prefix}-arrow)"/><text x="494" y="59" text-anchor="middle" font-size="10" fill="#7c8073" class="figure-label">${word('目标方向','Goal direction')}</text>`;
  } else {
    let points = '';
    for (let i=0;i<87;i++) {
      const a = i * 2.399963229728653;
      const radius = Math.sqrt((i + .5)/87);
      const x = 307 + Math.cos(a) * 130 * radius;
      const y = 228 + Math.sin(a) * 105 * radius;
      points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i%4===0?4.3:3.3}" fill="${i%5===0?'#9aa583':'#b8bfa7'}" opacity="${i%3===0?'.8':'.6'}"/>`;
    }
    object = `<path d="M188 151C224 106 294 100 343 124S419 138 438 200 423 300 375 325 258 345 207 308 165 218 188 151Z" fill="#d9dfca" fill-opacity=".6" stroke="#8e9c7a" stroke-width="1.4" stroke-dasharray="5 5"/>${points}<path d="M379 319 449 365h57" stroke="#8f9c7a" fill="none" stroke-width="1"/><text x="508" y="383" text-anchor="end" font-size="10" fill="#718162" class="figure-label">${word('观测边界','Observed boundary')}</text><path d="M477 123h35" stroke="#8d9a7c" stroke-width="1.3" marker-end="url(#${prefix}-arrow)"/><text x="502" y="104" text-anchor="middle" font-size="10" fill="#7c8572" class="figure-label">${word('部署目标','Deployment')}</text>`;
  }
  const trail = `<path d="M140 100C90 160 95 267 148 337M473 145C529 193 529 294 479 346" stroke="${color}" stroke-opacity=".2" stroke-dasharray="3 7" stroke-width="1.1" fill="none"/>`;
  const agentMarkup = guides.map(([x,y],i) => `<g class="diagram-agent"><circle cx="${x}" cy="${y}" r="19" fill="none" stroke="${color}" stroke-opacity=".13" stroke-width="1"/><circle cx="${x}" cy="${y}" r="11" fill="${color}" fill-opacity=".1"/>${type === 'transport'?`<circle cx="${x}" cy="${y}" r="6" fill="${color}" stroke="#fafbf5" stroke-width="1.8"/>`:`<rect x="${x-5.5}" y="${y-5.5}" width="11" height="11" rx="2" fill="${color}" stroke="#fafbf5" stroke-width="1.8"/>`}${!miniature && i===0?`<text x="${x-14}" y="${y-23}" font-size="8" fill="${color}">i = 1</text>`:''}</g>`).join('');
  const first = guides[0];
  const sensingMarkup = `<g class="sensing-layer"><path d="M${first[0]} ${first[1]} 279 127Q261 185 211 202Z" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-width="1" stroke-dasharray="3 4"/><path d="M${first[0]} ${first[1]} 232 156M${first[0]} ${first[1]} 211 193M${first[0]} ${first[1]} 270 132" stroke="${color}" stroke-width="1" opacity=".7"/><circle cx="${first[0]}" cy="${first[1]}" r="34" fill="none" stroke="${color}" stroke-opacity=".4" stroke-dasharray="2 4"/><path d="M95 67h81l15 29" stroke="${color}" fill="none" stroke-width="1"/><text x="95" y="57" font-size="9" fill="${color}" class="figure-label">${word('局部可见范围（示意）','Local sensing (illustrative)')}</text></g>`;
  const label = word(type==='transport'?'围绕未知物体的机器人配置概念图':'围绕静态人群的引导智能体部署概念图',type==='transport'?'Concept: robots deployed around an unknown object':'Concept: guide agents deployed around a static crowd');
  return `<svg class="research-figure" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" viewBox="0 0 620 440" xmlns="http://www.w3.org/2000/svg"><title id="${prefix}-title">${label}</title><desc id="${prefix}-desc">${word('仅用于解释研究主题，位置与轮廓均为示意，不代表算法输出。','Illustrative positions and boundaries explain the research topic; they are not algorithm outputs.')}</desc>${grid}${trail}${object}${sensingMarkup}${agentMarkup}<g transform="translate(49 391)">${type==='transport'?`<circle cx="0" cy="0" r="4" fill="${color}"/>`:`<rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="${color}"/>`}<text x="12" y="3" font-size="9" fill="#747e6c" class="figure-label">${word(type==='transport'?'机器人智能体':'引导智能体',type==='transport'?'Robot agent':'Guide agent')}</text></g><path d="M557 390h18m-18 0v-18" stroke="#a7afa0" stroke-width="1"/><text x="580" y="394" font-size="8" fill="#959f8e">x</text><text x="553" y="366" font-size="8" fill="#959f8e">y</text></svg>`;
}

for(language of ['zh','en']) for(const type of ['transport','crowd']) for(const sensing of [false,true]) {
 let svg=diagram(type,'concept-'+type+'-'+language);
 svg=svg.replace('<defs>', '<style>.sensing-layer{opacity:'+Number(sensing)+'} text{font-family:Arial,Microsoft YaHei,sans-serif}</style><defs>');
 const dest=path.resolve(__dirname,'../site/assets/concept-'+type+'-'+language+(sensing?'-sensing':'')+'.svg');
 fs.writeFileSync(dest,svg);
}
