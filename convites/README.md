# Convites digitais · base do produto

Base de venda dos convites digitais (confirmação de presença por família, história com fotos,
painel do cliente e painel do dono). Nasceu do convite da Betina, que continua **intocado** na pasta
`../betina` (branch congelada `claude/betina-v1-congelado`, tag local `betina-v1`).

> **Regra de ouro:** nada aqui usa o projeto Firebase `betina-1ano`. Esta pasta não tem `.firebaserc`
> nem `.env.production`, de propósito. Cada cliente recebe o próprio projeto/site.

## O que muda de um convite para outro

| Muda por tema (`src/themes.ts`) | Muda por cliente (painel → Festa) |
| --- | --- |
| cores, emojis que caem, fonte do título | nomes, data, local, textos, fotos da história |
| | nomes dos anfitriões, mensagens de WhatsApp, presentes |

O fluxo do convidado, as regras e o painel são sempre os mesmos.

## Temas prontos

`safari` (menino), `jardim` (menina), `ouro` e `prata` (casamento) e `fazendinha` (o tema original da Betina).
Para criar um novo: copie um bloco de `src/themes.ts`, troque as cores/emojis/fonte e pronto.

## Convites-modelo (vendas)

`src/lib/presets.ts` tem 4 convites fictícios completos (nomes, textos e mensagens). Eles alimentam a
demonstração (`npm run build:demo`), que não usa Firebase: os dados ficam só no navegador.
As imagens de `public/demo/` são ilustrações de exemplo geradas por `node scripts/make-demo-art.cjs`;
**troque pelas fotos finais** (mesmos nomes `p1..p8.jpg` e `invite.jpg`) quando tiver.

Na demonstração: barra "🧪" no topo troca de modelo e abre o painel do cliente e o painel do dono
(`#admin` e `#super` na URL também funcionam).

## Painel do dono (`/super`)

Clientes, funil de pedidos, financeiro (recebido, a receber, por mês/pacote/tema), biblioteca de temas
e configurações (pacotes e mensagens de briefing, entrega e cobrança). Só entra quem está em
`owners/<email>` no Firestore (criado pelo console, nunca pelo site).

## Novo cliente (resumo)

1. Criar o projeto Firebase do cliente e copiar `.env.example` para `.env.production`.
2. Ajustar o convite no painel (aba Festa) ou em `src/lib/presets.ts`.
3. `npm run build` e `firebase deploy --only hosting,firestore:rules`.
4. Anotar o link e o painel em `/super` → Clientes.

Ver `PRODUTO.md` para o que ainda falta antes de vender em escala.
