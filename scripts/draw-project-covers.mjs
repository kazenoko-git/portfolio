import { mkdir, writeFile } from 'node:fs/promises';

// Small original vector drawings, used as illustrations rather than fake UI shots.
const root = new URL('../public/images/projects/', import.meta.url);
await mkdir(root, { recursive: true });
const line =
  'fill="none" stroke="#25251f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
const label = (x, y, text, size = 19) =>
  `<text x="${x}" y="${y}" fill="#25251f" font-family="monospace" font-size="${size}">${text}</text>`;
const covers = {
  focus: [
    '#ffa86c',
    'A little focus goes a long way',
    `
    <path d="M0 390Q220 330 430 400T900 350" fill="none" stroke="#ef8156" stroke-width="100"/>
    <g transform="rotate(-8 360 270)"><rect x="170" y="70" width="370" height="350" rx="30" fill="#fff7dc" stroke="#25251f" stroke-width="5"/>
    <circle cx="355" cy="240" r="112" ${line}/><circle cx="355" cy="240" r="88" fill="#e9e8a9"/>
    <path d="M355 160V240L408 275M270 100H440" ${line}/><circle cx="355" cy="240" r="9" fill="#25251f"/>
    ${label(272, 390, 'MAKE TIME.', 25)}</g>
    <g transform="rotate(9 660 330)"><path d="M565 225H775V395H565Z" fill="#eee8fc" stroke="#25251f" stroke-width="4" stroke-dasharray="10 6"/>
    ${label(599, 270, 'ONE GOOD')}${label(605, 300, 'BREAK')}
    <path d="M620 325V350Q620 380 650 380H675Q704 380 704 350V325ZM704 330Q750 330 736 355Q727 367 704 360" ${line}/></g>
    <path d="M690 85L700 110L727 115L704 130L700 159L682 137L654 138L671 114L665 91Z" fill="#f4f3b4" stroke="#25251f" stroke-width="4"/>
  `,
  ],
  climate: [
    '#c5d9ae',
    'Somewhere a little cooler',
    `
    <g fill="none" stroke="#8eac77" stroke-width="3"><path d="M-50 140Q150 -30 310 140T650 100T1000 160M-50 170Q150 0 310 170T650 130T1000 190M-50 205Q150 35 310 205T650 165T1000 225M-50 400Q170 220 390 400T900 390M-50 435Q170 255 390 435T900 425M-50 470Q170 290 390 470T900 460"/></g>
    <path d="M90 360Q260 190 450 310T840 220" fill="none" stroke="#f7f1d4" stroke-width="26"/>
    <path d="M90 360Q260 190 450 310T840 220" fill="none" stroke="#25251f" stroke-width="3" stroke-dasharray="7 13"/>
    <g transform="rotate(-5 450 245)"><path d="M375 205L465 125L555 205V330H375Z" fill="#f8f4df" stroke="#25251f" stroke-width="5"/>
    <path d="M350 210L465 105L580 210M445 330V255H490V330" ${line}/><path d="M405 205H430V235H405Z" fill="#edac70"/>
    <path d="M565 110Q565 65 608 65Q652 65 652 110Q652 140 608 185Q565 140 565 110Z" fill="#f07763" stroke="#25251f" stroke-width="5"/>
    <circle cx="608" cy="108" r="12" fill="#f8f4df"/></g>
    <path d="M175 115L175 178M145 145H205M728 330L728 385M701 357H755" ${line}/>
    ${label(90, 440, 'FIND A LITTLE SHELTER.')}
  `,
  ],
  orbit: [
    '#cdc6f1',
    'An atom, approximately',
    `
    <g transform="translate(445 245)"><ellipse rx="240" ry="79" transform="rotate(-28)" fill="#e8e2ff" stroke="#353064" stroke-width="5"/>
    <ellipse rx="240" ry="79" transform="rotate(30)" fill="none" stroke="#353064" stroke-width="5"/>
    <ellipse rx="240" ry="79" transform="rotate(90)" fill="none" stroke="#353064" stroke-width="5"/>
    <circle r="45" fill="#f59d70" stroke="#353064" stroke-width="5"/><circle cx="213" cy="-74" r="17" fill="#f5f1ba" stroke="#353064" stroke-width="4"/>
    <circle cx="-140" cy="-115" r="13" fill="#f5f1ba" stroke="#353064" stroke-width="4"/></g>
    <path d="M720 190L770 135L820 135M230 352L177 402H100" ${line}/>
    ${label(90, 445, 'A QUESTION OF PROBABILITY.')}${label(680, 112, 'not to scale', 16)}
  `,
  ],
  chip: [
    '#ecd18c',
    'Thoughts on a very small piece of silicon',
    `
    <g transform="rotate(8 460 240)"><rect x="310" y="100" width="300" height="285" rx="12" fill="#cdc6f1" stroke="#25251f" stroke-width="5"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${340 + i * 39} 70V100M${340 + i * 39} 385V420M280 ${130 + i * 38}H310M610 ${130 + i * 38}H640" ${line}/>`).join('')}
    <rect x="360" y="150" width="200" height="180" rx="5" fill="#f5f0d8" stroke="#25251f" stroke-width="4"/>
    <path d="M390 275L420 235L449 255L480 200L523 220M390 195H420M495 280H525" ${line}/>
    <circle cx="333" cy="357" r="7" fill="#25251f"/></g>
    <path d="M95 140Q210 60 270 120L248 95M270 120L240 130" ${line}/>
    ${label(90, 188, 'tiny chip.')}${label(650, 365, 'big questions.')}
  `,
  ],
  deploy: [
    '#f0b4c5',
    'Please do not deploy on a Friday',
    `
    <g transform="rotate(-7 420 260)"><path d="M200 100H630V400H200Z" fill="#faf3d8" stroke="#25251f" stroke-width="5"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${200 + i * 86} 100V400" fill="none" stroke="#25251f" stroke-width="3"/>`).join('')}
    <path d="M200 175H630M200 325H630" ${line}/><rect x="286" y="175" width="258" height="150" fill="#b7caac" stroke="#25251f" stroke-width="4"/>
    ${label(330, 265, 'YOUR MOVE.', 25)}<circle cx="238" cy="365" r="17" fill="#e98760" stroke="#25251f" stroke-width="4"/></g>
    <g transform="rotate(15 715 340)"><rect x="655" y="280" width="115" height="115" rx="17" fill="#cdc6f1" stroke="#25251f" stroke-width="5"/>
    <circle cx="685" cy="310" r="8" fill="#25251f"/><circle cx="740" cy="365" r="8" fill="#25251f"/><circle cx="712" cy="337" r="8" fill="#25251f"/></g>
    ${label(80, 455, 'SHIP IT. SEE WHAT HAPPENS.')}
  `,
  ],
  code: [
    '#abd1d4',
    'A small experiment',
    `
    <g transform="rotate(-5 450 250)"><path d="M235 125H670V370H235Z" fill="#f8f0d9" stroke="#25251f" stroke-width="5"/>
    <path d="M235 175H670M315 200L275 245L315 290M590 200L630 245L590 290M475 195L425 305" ${line}/>
    <circle cx="260" cy="151" r="6" fill="#ef9c76"/><circle cx="280" cy="151" r="6" fill="#adbb91"/>
    <path d="M215 370H690L730 400H170Z" fill="#cdc6f1" stroke="#25251f" stroke-width="5"/></g>
    <path d="M130 115L140 140L167 145L144 160L140 189L122 167L94 168L111 144L105 121Z" fill="#ead18a" stroke="#25251f" stroke-width="4"/>
    ${label(90, 455, 'WHAT IF THIS WORKED?')}
  `,
  ],
};
for (const [name, [background, title, drawing]] of Object.entries(covers)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" role="img"><title>${title}</title><rect width="900" height="500" fill="${background}"/>${drawing}</svg>`;
  await writeFile(new URL(`${name}.svg`, root), svg);
}
