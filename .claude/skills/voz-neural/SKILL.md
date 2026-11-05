---
name: voz-neural
description: Narração com voz neural feminina em português (vozes Microsoft pt-BR Thalita e Francisca) com tempo exato de cada palavra, para reels, anúncios e vídeos da Confete. Use quando precisar de locução, voz de IA, narração ou legenda sincronizada palavra por palavra.
---

# Voz neural (pt-BR) com tempo por palavra

Ferramentas: `convites/marketing/marca/kit/reel-oficial/v4/`.

1. Roteiro em `roteiro.json`: cada linha tem `chunks` = [texto, posição]. `{{palavra}}` marca a palavra-chave em destaque. Posições: `top`, `behind` (sai de trás do painel), `mid`, `btn`, `bio`.
2. `pip install edge-tts` e `python3 narrar.py roteiro.json narr` → `narr.wav` + `narr_tempos.json` (início de cada palavra, vindo do próprio motor de voz).
3. `python3 compactar.py narr` → encurta pausas longas (acima de 0,26 s viram 0,20 s) e reajusta os tempos (`narr_c.wav`, `narr_c_tempos.json`).
4. O vídeo lê os tempos (`reel4.html` usa `tempos4.js` = `window.TL = <narr_c_tempos.json>`).

Vozes: `pt-BR-ThalitaMultilingualNeural` (padrão, mais natural e acolhedora) e `pt-BR-FranciscaNeural` (clássica). Ajuste `rate` (ex.: "+6%") e `pitch`.
Rede: o ambiente usa proxy com CA própria; `narrar.py` aponta para `/root/.ccr/ca-bundle.crt`.

**Licença (avise o dono):** o `edge-tts` usa o serviço gratuito de leitura do navegador Edge, sem contrato de uso comercial. Para anúncio pago, o caminho licenciado é gerar a mesma voz pelo **Azure Speech** (tem cota gratuita mensal e permite uso comercial) com a chave do próprio dono. Alternativa local e livre (Apache 2.0): Kokoro (`hyperframes tts`, voz `pf_dora`), menos natural.
