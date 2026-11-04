import { makeOg } from '/home/user/Design/convites/scripts/lib/og.mjs'
import { build } from '/home/user/Design/convites/node_modules/esbuild/lib/main.js'
await build({ entryPoints: ['/home/user/Design/convites/scripts/lib/compose.ts'], bundle: true, platform: 'node', format: 'esm', outfile: '/home/user/Design/convites/.stage/_c4.mjs', logLevel: 'error', define: { 'import.meta.env.BASE_URL': '"/"', 'import.meta.env.MODE': '"x"' } })
const { THEMES } = await import('/home/user/Design/convites/.stage/_c4.mjs')
await makeOg({ outfile: '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/reel/stills/og-jardim.jpg', theme: THEMES.find((x) => x.id === 'jardim'), eyebrow: 'A festa da Lara', title: 'Lara', date: '17 ABR · 10H', image: '/home/user/Design/convites/public/demo/jardim/invite-sem-idade.jpg' })
