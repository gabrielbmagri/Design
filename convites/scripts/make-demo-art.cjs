// Gera as imagens ilustradas de exemplo dos convites-modelo (sem fotos reais de crianças).
// Saída: public/demo/<tema>/p1..p8.jpg (3:4) e invite.jpg (9:16). Uso: node scripts/make-demo-art.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const T = {
  safari: { bg: [['#ffe9b8', '#f6b66b'], ['#d9ecb0', '#8fbf6a'], ['#ffd9a0', '#e58d4a'], ['#f4e4b9', '#c9a35f'], ['#cfe8c0', '#6fa561'], ['#ffe2b0', '#d9873c'], ['#e5f0c4', '#9cc16e'], ['#fbe0a8', '#e0a04b']],
    em: ['🦁', '🐘', '🦒', '🦓', '🐒', '🐯', '🦏', '🐊'], deco: ['🌴', '🌿', '☀️', '🌾'], title: 'Théo', sub: 'faz 1 aninho', line: 'Uma aventura selvagem!', date: '20 MAR · 15H', place: 'Espaço Safari Park', c: '#2f6b3a', c2: '#e08a2b', paper: '#fdf8ea' },
  jardim: { bg: [['#f6e1fb', '#d8b4ee'], ['#e0f4e8', '#9fd6b8'], ['#fde4ef', '#f0a9c8'], ['#e9e1fb', '#b9a4e6'], ['#fff0d9', '#f4c98c'], ['#e1f3f6', '#9ccfdc'], ['#f9e3f3', '#e3a6d2'], ['#e7f6d9', '#b4d98a']],
    em: ['🦋', '🌸', '🐝', '🌷', '🐞', '🍄', '🌺', '🧚'], deco: ['🌼', '🌿', '✨', '🍃'], title: 'Lara', sub: 'faz 1 aninho', line: 'O jardim está em flor!', date: '17 ABR · 10H', place: 'Jardim das Borboletas', c: '#8e5bb5', c2: '#6fbf9b', paper: '#fefbff' },
  ouro: { bg: [['#fff6dc', '#e8cf8f'], ['#fdf0d0', '#d8b866'], ['#fffaf0', '#eadbb4'], ['#f7e9c6', '#cfa95a'], ['#fff3d6', '#e2c47a'], ['#fbf1d9', '#d4b26a'], ['#fffbee', '#ecdca8'], ['#f5e6bd', '#c9a24d']],
    em: ['💍', '🥂', '🕊️', '🤍', '💐', '✨', '🌿', '💛'], deco: ['✨', '🤍', '🌿', '✨'], title: 'Helena & Rafael', sub: 'vão se casar', line: 'Com a bênção de Deus e o carinho de vocês', date: '22 MAI · 17H', place: 'Casa Aurora', c: '#8a6a2a', c2: '#c9a24d', paper: '#fffdf7' },
  prata: { bg: [['#eef2f8', '#bcc7d8'], ['#f4f6fa', '#a9b6ca'], ['#e8edf5', '#9aa9bf'], ['#f7f8fb', '#c8d1df'], ['#e6ecf4', '#aab7cb'], ['#f1f4f9', '#b3bfd2'], ['#eaeff6', '#a1afc4'], ['#f5f7fb', '#bcc8da']],
    em: ['💍', '🥂', '🕊️', '🤍', '💐', '✨', '🌿', '🩶'], deco: ['✨', '🤍', '🌿', '✨'], title: 'Júlia & André', sub: 'vão se casar', line: 'Nosso começo, juntos para sempre', date: '12 JUN · 16H', place: 'Villa Cristal', c: '#46556b', c2: '#8795ab', paper: '#fbfcfe' },
}
const LUX = {
  ouro: { bg: '#14110b', fg: '#e9d49a', fg2: '#b08a3c', paper: '#0f0d08', mono: 'H&R', names: 'Helena & Rafael', date: '22 · 05 · 2027', place: 'CASA AURORA · CAMPINAS' },
  prata: { bg: '#10151c', fg: '#dfe5ee', fg2: '#8f9db3', paper: '#0c1015', mono: 'J&A', names: 'Júlia & André', date: '12 · 06 · 2027', place: 'VILLA CRISTAL · PETRÓPOLIS' },
}
function luxScene(t, i) {
  const k = LUX[t]
  const rings = `<svg viewBox="0 0 400 240" width="760" style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(${(i - 3) * 2}deg)" fill="none" stroke="${k.fg}" stroke-width="2.4"><circle cx="150" cy="120" r="88"/><circle cx="250" cy="120" r="88"/><path d="M200 38v12M196 44h8" stroke="${k.fg2}"/></svg>`
  const lines = Array.from({ length: 7 }, (_, n) => `<div style="position:absolute;left:-10%;right:-10%;top:${12 + n * 13 + rnd(i + n) * 4}%;height:1px;background:linear-gradient(90deg,transparent,${k.fg2}55,transparent);transform:rotate(${-8 + i * 2}deg)"></div>`).join('')
  const orb = `<div style="position:absolute;left:${20 + rnd(i) * 50}%;top:${10 + rnd(i + 3) * 30}%;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,${k.fg2}55,transparent 65%);filter:blur(30px)"></div>`
  const bokeh = Array.from({ length: 16 }, (_, n) => `<i style="position:absolute;left:${rnd(i * 9 + n) * 100}%;top:${rnd(i * 5 + n + 2) * 100}%;width:${14 + rnd(n + i) * 46}px;height:${14 + rnd(n + i) * 46}px;border-radius:50%;background:${k.fg}${['18', '22', '2c'][n % 3]}"></i>`).join('')
  return `<html><body style="margin:0;width:1200px;height:1600px;overflow:hidden;background:radial-gradient(120% 90% at 30% 10%,${k.bg},#050505);position:relative;font-family:'Cormorant Garamond',Georgia,serif">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&display=swap" rel="stylesheet">
${orb}${lines}${bokeh}${rings}
<div style="position:absolute;inset:60px;border:1.5px solid ${k.fg2}88"></div><div style="position:absolute;inset:78px;border:1px solid ${k.fg2}44"></div>
${i === 5 ? '' : `<div style="position:absolute;left:0;right:0;top:67%;text-align:center;color:${k.fg};font:700 120px/1 'Cormorant Garamond',serif;letter-spacing:.06em">${k.mono}</div>
<div style="position:absolute;left:0;right:0;top:78%;text-align:center;color:${k.fg2};font:500 34px 'Cormorant Garamond',serif;letter-spacing:.5em">${k.date}</div>`}</body></html>`
}
function luxInvite(t) {
  const k = LUX[t]
  return `<html><body style="margin:0;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(120% 80% at 30% 0%,${k.bg},#050505);position:relative;text-align:center;color:${k.fg};font-family:'Cormorant Garamond',Georgia,serif">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Pinyon+Script&display=swap" rel="stylesheet">
<div style="position:absolute;inset:56px;border:1.5px solid ${k.fg2}99"></div><div style="position:absolute;inset:76px;border:1px solid ${k.fg2}55"></div>
<div style="position:absolute;top:210px;left:0;right:0;font:500 34px 'Cormorant Garamond';letter-spacing:.55em;color:${k.fg2}">CONVITE DE CASAMENTO</div>
<svg viewBox="0 0 400 240" width="520" style="position:absolute;left:50%;top:330px;transform:translateX(-50%)" fill="none" stroke="${k.fg}" stroke-width="2"><circle cx="150" cy="120" r="88"/><circle cx="250" cy="120" r="88"/></svg>
<div style="position:absolute;top:760px;left:60px;right:60px;font:400 150px/1.05 'Pinyon Script',cursive;color:${k.fg}">${k.names}</div>
<div style="position:absolute;top:1130px;left:0;right:0;font:500 40px 'Cormorant Garamond';letter-spacing:.4em;color:${k.fg2}">TÊM A ALEGRIA DE CONVIDAR VOCÊ</div>
<div style="position:absolute;top:1330px;left:200px;right:200px;height:1px;background:${k.fg2}88"></div>
<div style="position:absolute;top:1390px;left:0;right:0;font:700 74px 'Cormorant Garamond';letter-spacing:.2em">${k.date}</div>
<div style="position:absolute;top:1520px;left:0;right:0;font:500 38px 'Cormorant Garamond';letter-spacing:.34em;color:${k.fg2}">${k.place}</div></body></html>`
}
const rnd = (s) => { let x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x) }
function scene(t, i) {
  const [a, b] = t.bg[i], big = t.em[i % t.em.length], mid = t.em[(i + 3) % t.em.length]
  const parts = []
  for (let k = 0; k < 14; k++) parts.push(`<i style="left:${rnd(i * 20 + k) * 100}%;top:${rnd(i * 31 + k + 7) * 100}%;width:${30 + rnd(k + i) * 120}px;height:${30 + rnd(k + i) * 120}px"></i>`)
  const decos = [0, 1, 2, 3, 4, 5].map((k) => `<b style="left:${6 + rnd(i * 7 + k) * 84}%;top:${4 + rnd(i * 11 + k) * 40}%;font-size:${50 + rnd(k + i * 3) * 50}px;transform:rotate(${(rnd(k + i) - .5) * 50}deg);opacity:.85">${t.deco[k % t.deco.length]}</b>`).join('')
  return `<html><body style="margin:0;width:1200px;height:1600px;overflow:hidden;background:linear-gradient(170deg,${a},${b});position:relative;font-family:sans-serif">
<style>i{position:absolute;border-radius:50%;background:rgba(255,255,255,.28);filter:blur(2px)} b{position:absolute;font-weight:400}
.hill{position:absolute;left:-10%;right:-10%;bottom:-8%;height:34%;border-radius:50% 50% 0 0/80% 80% 0 0;background:rgba(255,255,255,.35)}
.hill2{position:absolute;left:-20%;right:-20%;bottom:-14%;height:30%;border-radius:50% 50% 0 0/70% 70% 0 0;background:rgba(255,255,255,.5)}
.main{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%) rotate(${(rnd(i) - .5) * 14}deg);font-size:${520 + (i % 3) * 60}px;filter:drop-shadow(0 30px 40px rgba(0,0,0,.22))}
.side{position:absolute;left:${i % 2 ? 10 : 62}%;top:${i % 2 ? 66 : 70}%;font-size:260px;filter:drop-shadow(0 18px 24px rgba(0,0,0,.2))}</style>
${parts.join('')}${decos}<div class="hill"></div><div class="hill2"></div><div class="main">${big}</div><div class="side">${mid}</div></body></html>`
}
function invite(t, id) {
  const f = `public/demo/${id}/p6.jpg`
  const photo = fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : ''
  return `<html><body style="margin:0;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(170deg,${t.bg[0][0]},${t.bg[0][1]});position:relative;text-align:center;font-family:'Playfair Display',Georgia,serif;color:${t.c}">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Dancing+Script:wght@700&family=Nunito:wght@900&display=swap" rel="stylesheet">
<div style="position:absolute;inset:50px;border-radius:70px;background:${t.paper};box-shadow:0 30px 70px rgba(0,0,0,.18)"></div>
${photo ? `<div style="position:absolute;left:100px;right:100px;top:100px;height:960px;border-radius:52px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.25)"><img src="${photo}" style="width:100%;height:100%;object-fit:cover;object-position:50% 25%"></div>` : `<div style="position:absolute;top:150px;left:0;right:0;font-size:120px">${t.deco.join(' ')}</div>`}
<div style="position:absolute;top:${photo ? 1090 : 360}px;left:0;right:0;font:900 ${t.title.length > 12 ? 112 : (t.title.length > 8 ? 150 : 200)}px/1 'Playfair Display',serif">${t.title}</div>
<div style="position:absolute;top:${photo ? 1300 : 620}px;left:0;right:0;font:900 70px 'Playfair Display',serif;color:${t.c2}">${t.sub}</div>
<div style="position:absolute;top:${photo ? 1410 : 800}px;left:80px;right:80px;font:700 78px/1.15 'Dancing Script',cursive;color:${t.c}">${t.line}</div>
<div style="position:absolute;top:${photo ? 1620 : 1480}px;left:0;right:0;font:900 80px Nunito,sans-serif;color:${t.c2}">${t.date}</div>
<div style="position:absolute;top:${photo ? 1740 : 1610}px;left:0;right:0;font:900 46px Nunito,sans-serif;color:${t.c}">${t.place}</div></body></html>`
}
;(async () => {
  const b = await chromium.launch()
  for (const [id, t] of Object.entries(T)) {
    const dir = path.join('public/demo', id); fs.mkdirSync(dir, { recursive: true })
    const p = await b.newPage({ viewport: { width: 1200, height: 1600 } })
    // safari e jardim já têm fotos de IA em p1..p8: não sobrescrever
    const FOTOS_PRONTAS = id === 'safari' || id === 'jardim'
    for (let i = 0; i < 8 && !FOTOS_PRONTAS; i++) { await p.setContent(LUX[id] ? luxScene(id, i) : scene(t, i)); await p.waitForTimeout(400); await p.waitForTimeout(150); await p.screenshot({ path: `${dir}/p${i + 1}.jpg`, type: 'jpeg', quality: 82 }) }
    await p.setViewportSize({ width: 1080, height: 1920 }); await p.setContent(LUX[id] ? luxInvite(id) : invite(t, id)); await p.waitForTimeout(1200); await p.screenshot({ path: `${dir}/invite.jpg`, type: 'jpeg', quality: 86 })
    console.log('ok', id)
  }
  // versões sem idade no convite (usadas nos vídeos de venda)
  for (const id of ['safari', 'jardim']) {
    const t = { ...T[id], sub: 'está de aniversário' }
    const p2 = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p2.setContent(invite(t, id)); await p2.waitForTimeout(1200)
    await p2.screenshot({ path: `public/demo/${id}/invite-sem-idade.jpg`, type: 'jpeg', quality: 86 })
  }
  await b.close()
})()
