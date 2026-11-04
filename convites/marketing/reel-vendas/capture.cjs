const { chromium, devices } = require('playwright')
const O = '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/reel/stills/'
const URL = 'http://127.0.0.1:5180/'
const phone = { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 }
async function ctxFor(b, preset) {
  const c = await b.newContext(phone)
  await c.addInitScript((p) => { try { localStorage.setItem('convite-demo-preset', p); localStorage.setItem('convite-demo-reel', '1') } catch {} }, preset)
  return c
}
// esconde a barra de demonstração nas capturas
const hideBar = (p) => p.addStyleTag({ content: 'div[style*="z-index: 999"]{display:none!important}' })
;(async () => {
  const b = await chromium.launch()
  for (const [preset, tag] of [['safari', 'g'], ['jardim', 'j']]) {
    const c = await ctxFor(b, preset); const p = await c.newPage()
    await p.goto(URL); await p.waitForTimeout(3500); await hideBar(p)
    await p.screenshot({ path: O + `${tag}-1-entrada.png` })
    await p.locator('#nome').fill('marina'); await p.waitForTimeout(500); await p.screenshot({ path: O + `${tag}-2-digitando.png` })
    await p.getByRole('button', { name: /^Continuar/ }).click(); await p.waitForTimeout(1200)
    await p.screenshot({ path: O + `${tag}-3-pick.png` })
    await p.getByRole('button', { name: 'Sim, sou eu' }).click(); await p.waitForTimeout(900); await p.screenshot({ path: O + `${tag}-4-rsvp.png` })
    await p.getByRole('button', { name: /Enviar resposta|Continuar/ }).click(); await p.waitForTimeout(3200)
    await p.screenshot({ path: O + `${tag}-5-hero.png` })
    const H = await p.evaluate(() => document.body.scrollHeight)
    let k = 6
    for (const y of [1100, 2300, 3500, 4700]) { if (y > H) break; await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(1500); await p.screenshot({ path: O + `${tag}-${k++}-hist.png` }) }
    console.log(preset, 'altura', H)
    await c.close()
  }
  // painel da mãe (celular), com a lista grande
  const c = await ctxFor(b, 'safari'); const p = await c.newPage()
  await p.goto(URL + '#admin')
  await p.waitForFunction(() => { try { return Object.keys(JSON.parse(localStorage.getItem('convite-demo-db') || '{}')['events/principal/invites'] || {}).length >= 40 } catch { return false } }, null, { timeout: 60000 })
  await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(3500); await hideBar(p)
  await p.screenshot({ path: O + 'a-1-visao.png' })
  await p.evaluate(() => window.scrollTo(0, 560)); await p.waitForTimeout(700); await p.screenshot({ path: O + 'a-2-visao2.png' })
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.locator('.ad-mobile-nav').getByRole('button', { name: 'Convites' }).click(); await p.waitForTimeout(1200); await p.screenshot({ path: O + 'a-3-convites.png' })
  await p.locator('.ad-mobile-nav').getByRole('button', { name: 'Lembretes' }).click(); await p.waitForTimeout(1200); await p.screenshot({ path: O + 'a-4-lembretes.png' })
  await p.locator('.ad-mobile-nav').getByRole('button', { name: 'Pessoas' }).click(); await p.waitForTimeout(1200); await p.screenshot({ path: O + 'a-5-pessoas.png' })
  await c.close(); await b.close()
})()
