# Convites digitais · base do produto

Convite digital com confirmação de presença por família, história com fotos, painel do cliente e painel do dono.
Nasceu do convite da Betina, que continua **intocado** na pasta `../betina` (branch congelada `claude/betina-v1-congelado`).

> **Regra de ouro:** nada aqui usa o projeto Firebase da Betina (`betina-1ano`). Esta pasta não tem `.firebaserc`
> nem `.env.production`, de propósito.

## Como funciona (resumo)

- **Um banco para vários convites.** Cada evento fica em `events/{id}/…` (convidados, convites, histórico, presentes, acessos).
- **Um site de hospedagem por cliente**, com o nome dele na prévia do WhatsApp (`VITE_EVENT_ID` aponta para o evento).
- **Você cadastra o cliente; ele só entra.** Nada de cadastro: o cliente recebe e-mail + senha provisória e troca a senha no primeiro acesso.

## Cadastrar um cliente (o fluxo do dia a dia)

1. Mande o formulário (`clients/_modelo/FORMULARIO-WHATSAPP.md`) e receba as respostas e as fotos pelo WhatsApp.
2. Preencha `clients/<id>/cliente.json` (ou mande tudo para o Claude, que preenche e roda para você). Ver `clients/_modelo/LEIA-ME.md`.
3. `npm run cliente -- clients/<id>/cliente.json --projeto <projeto> --publicar`
4. Envie ao cliente o convite, o painel, o e-mail e a senha provisória (botão **Enviar links** no seu painel).
5. Acompanhe em `/super`: situação do pedido, financeiro, "Aguardando 1º acesso" / "Acesso ativo".

Teste local sem gravar nada na nuvem: `npx firebase emulators:start --only firestore,auth --project demo-convites`
e depois `npm run cliente -- clients/_modelo/cliente.json --emulador`.

## Senha provisória (como protege)

- O cliente entra com e-mail + senha provisória e **é obrigado a criar a própria senha** antes de ver qualquer coisa.
- "Esqueci a senha" envia um link por e-mail.
- O cadastro público deve ficar **desligado** no Firebase (Authentication → Configurações → Ações do usuário → desmarcar "Ativar criação (cadastro)"): só você cria contas, pelo script.
- **Cuidado:** a mesma senha provisória para todos (`Convite123`) é fácil de adivinhar. Quem souber o e-mail do cliente entra antes dele. Para vender, prefira `--aleatoria` (uma senha diferente por cliente) ou entregue a senha só pelo WhatsApp e peça para trocar na hora.

## Loja de presentes (opcional)

Desligada por padrão. Quando o cliente quer: aceita os termos, cadastra a chave Pix (em nome dele), e o convite mostra itens para reservar
e cotas via Pix (QR Code e "copia e cola" com valor). O dinheiro vai **direto para a conta dele**; o site não processa nem guarda pagamento.
O convidado avisa "já enviei" e o cliente confirma em **Presentes** no painel. Termos em `src/legal/content.tsx` (modelos; peça revisão jurídica).

## Temas e modelos de venda

`src/themes.ts` (Safari, Jardim Encantado, Casamento Ouro, Casamento Prata e Fazendinha). Tema novo = copiar um bloco.
`src/lib/presets.ts` tem 4 convites fictícios que alimentam a demonstração (`npm run build:demo`, sem Firebase).
Imagens de exemplo: `node scripts/make-demo-art.cjs`; fotos finais: ver `PROMPTS-FOTOS-IA.md`.

## Painel do dono (`/super`)

Clientes, funil, financeiro, temas e configurações (pacotes e mensagens). Só entra quem estiver em `owners/<email>`:
`node scripts/criar-dono.mjs voce@gmail.com --projeto <projeto>`.

## Preparar um projeto Firebase novo (uma vez)

1. Criar o projeto; ativar **Firestore** (São Paulo) e **Authentication** com **E-mail/senha** (e Google, para o seu painel).
2. Desligar o cadastro público (acima).
3. Copiar `.env.example` para `.env.production` e preencher com o app Web.
4. `npx firebase deploy --only firestore:rules --project <projeto>`.
5. `node scripts/criar-dono.mjs voce@gmail.com --projeto <projeto>`.

Ver `PRODUTO.md` para o que ainda falta antes de vender em escala.
