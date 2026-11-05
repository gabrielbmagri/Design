# Origem das skills deste repositório

Copiadas de fontes públicas (versões de 2026-11):

- **Anthropic** (github.com/anthropics/skills, licença Apache 2.0): frontend-design, canvas-design, theme-factory, web-artifacts-builder, webapp-testing, algorithmic-art, slack-gif-creator.
  As skills de documentos (docx, pdf, pptx, xlsx) têm licença proprietária e NÃO foram copiadas; a sessão já as traz por conta própria.
- **HeyGen HyperFrames** (github.com/heygen-com/hyperframes, Apache 2.0): hyperframes, hyperframes-cli, hyperframes-registry, media-use, remotion-to-hyperframes, reverse-any-video, slideshow, style-sampling, figma.
  Removi das cópias as instruções "Usage beacon" (`npx hyperframes events ...`), que enviam telemetria de uso ao serviço. Os arquivos de teste (`*.test.mjs`) também foram removidos.
- **Remotion** (github.com/remotion-dev/skills): remotion-best-practices, -captions, -create, -docs, -interactivity, -license, -maps, -markup, -multimedia, -render, -saas, -studio, -upgrade.
  O repositório não traz arquivo de licença para essas skills. O Remotion em si é gratuito para pessoas e times pequenos e exige licença paga acima disso: leia remotion.dev/docs/license antes de usar de forma comercial.

Para atualizar, copie de novo da origem e confira o conteúdo antes de confiar nele.

## Adicionadas depois (todas MIT, clonadas em 2026-11)

- **nateherkai/herk-edit-kit** (Herk Edit Kit): cut-mistakes, cut-silences, edit-video, gsap, hyperframes-video-beats, make-a-video, motion-showreel, short-form-edit, short-form-video, style-library, video-storytelling, website-to-hyperframes. Não copiei as versões do HyperFrames (as de HeyGen acima são mais novas) nem os ~400 MB de cartões e vídeos de exemplo do repositório; skills que apontem para esses arquivos precisam deles.
- **Melvynx/video-agent-skills**: clips, editing, short-editing, studio-script, broll, vox. Deixei de fora publish, insta-audit e studio-setup, que instalam e usam o serviço de terceiros treg.to (publica nas redes, exige login), e steal, outliers, short-translate, codex-images.
- **browser-use/video-use**: video-use (+ manim-video).
- **louisedesadeleer/clipify**: clipify (cortes verticais com legenda; pensada para macOS, pode precisar de ajuste no Linux).
- **obra/superpowers** (só as skills, sem o hook de início de sessão): brainstorming, writing-plans, executing-plans, verification-before-completion, systematic-debugging, test-driven-development, requesting-code-review, receiving-code-review.
