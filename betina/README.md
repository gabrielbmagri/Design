# Betina · 1 aninho 💗

Site de convite + confirmação de presença e painel de gestão de convidados.
React + Vite + Firebase (Firestore, Authentication e Hosting) — funciona no plano gratuito (Spark).

## O que tem

**Site do convidado** (`/` e `/c/<convite>`)
1. **Identificação**: carrossel de fotos da Betina e um único campo grande "Digite seu nome".
   Aceita só o primeiro nome, nome e sobrenome, com ou sem acento e em maiúsculas ou minúsculas, ou o celular.
   Se o nome aparecer em mais de um convite, a pessoa escolhe o dela. Embaixo fica um link discreto para quem só quer ver as informações.
2. **Confirmação**: cada pessoa do convite tem botões grandes ("Sim, eu vou", "Não vou poder ir", "Ainda não sei"). Tem também o atalho "Todos vão!".
   Qualquer pessoa do convite responde por todas. "Decidir depois" deixa a resposta em branco.
   No caso de criança sem idade cadastrada, o site pergunta a idade com botões − e +.
3. **Imersão**: mensagem conforme a resposta e depois a história com fotos, misturada com data e contagem regressiva, local (Maps/Waze), presentes e traje. Tem brilhos, corações e parallax.
4. **Convite completo**: menu lateral com Convite, Data e horário, Local, Sugestões de presente, Minha confirmação (para alterar a resposta), Ver a história de novo e Falar com a família.
   O aparelho lembra quem é a pessoa, e na próxima visita aparece "Que bom te ver de novo, Maria!".
5. **Link pessoal** `/c/<id>`: vai na mensagem do WhatsApp e abre direto no convite certo, sem precisar digitar o nome.

**Painel** (`/admin`, login com Google)
- **Painel**: confirmados, quem conta no limite, aguardando, recusas, lembrancinhas, crianças isentas e envios.
  Uma barra por anfitrião (Gabriel / Luiza, 50 cada) mostra as vagas livres e tem o botão "Chamar reserva".
- **Convites**: criar e editar convites com várias pessoas, criança + idade, celular, etiquetas e observações. Também dá para:
  - importar uma lista colada (uma linha por convite);
  - filtrar e buscar;
  - mudar a resposta de qualquer pessoa;
  - enviar pelo WhatsApp (texto + link prontos);
  - copiar o link;
  - mover para a reserva ou tirar dela;
  - arquivar (nada é apagado).
- **Lembretes**: lista quem não respondeu X dias (padrão 7) depois do envio, com botão que abre o WhatsApp já com o texto de lembrete e o link. Também mostra os convites não enviados.
- **Crianças**: todas as crianças (base das lembrancinhas) e as de até 5 anos, que não pagam e ficam fora do limite de 100. Mostra também quem está sem idade e permite editar a idade direto na tabela.
- **Histórico**: cada resposta registrada, com quem respondeu e quando.
- **Festa**: data, horário, local, textos, mensagens do WhatsApp, fotos, história, presentes, Pix, regras (limite, idade isenta, dias para lembrete), administradores e backup (JSON e planilha CSV).

## Proteção dos dados

- **Histórico permanente** (`rsvpLog`): só aceita inclusão. Ninguém edita nem apaga, nem o admin. Mesmo que algo seja alterado, toda confirmação fica registrada.
- **Arquivar em vez de apagar**: convites e pessoas removidos ficam guardados.
- **Telefones** ficam só em `invites`, que só o admin lê. O documento público do convidado não tem telefone; a busca por celular usa um código derivado do número.
- **Respostas com falha de internet**: ficam salvas no aparelho e são enviadas quando a conexão voltar.
- **Regras de segurança** (`firestore.rules`): o convidado só consegue mudar a própria resposta e a idade da criança, e só enquanto as confirmações estiverem abertas.
- **Backup**: baixe pelo painel (Festa → Backup). No plano Blaze dá para ligar backups automáticos e recuperação de até 7 dias atrás (PITR) no console do Firestore.

## Configurar o Firebase (uma vez)

1. Em <https://console.firebase.google.com>, crie o projeto **Betina**. Anote o *ID do projeto* (ex.: `betina-1ano`).
2. **Firestore Database**: criar banco em modo produção, região `southamerica-east1` (São Paulo).
3. **Authentication → Método de login**: ative **Google** e **Anônimo**.
4. **Configurações do projeto → Seus apps → Web** (`</>`): registre o app e copie a configuração para `.env.local` (modelo em `.env.example`).
5. Em `.firebaserc`, coloque o ID do projeto.
6. Primeiro administrador: no Firestore, crie a coleção `admins` com um documento cujo **ID é o seu e-mail Google** (o conteúdo pode ser qualquer campo). Os próximos (ex.: Luiza) você adiciona pelo próprio painel.
7. Publicar:
   ```bash
   npm install
   npx firebase login
   npm run deploy      # build + regras + índices + hosting
   ```
8. Em **Authentication → Configurações → Domínios autorizados**, confira que o domínio do site está na lista (`<id>.web.app` já vem).

## Imagem do WhatsApp

Coloque o convite em `og-source/convite.jpg` (ou `.png`) e rode `npm run og`. O script gera `public/og/convite.jpg` em 1200×630, com o convite inteiro centralizado sobre um fundo desfocado do próprio convite. É o formato que o WhatsApp mostra como imagem grande acima do link.
Depois, `npm run deploy`. O WhatsApp guarda a prévia em cache: para testar uma prévia nova, envie o link com `?v=2` no final.

## Fotos

Troque os arquivos em `public/photos/` pelas fotos reais (de preferência `.jpg` com até ~1600px). Depois ajuste os caminhos em **Festa → Fotos / História** no painel.

## Desenvolvimento local (sem tocar no banco real)

```bash
npx firebase emulators:start --only firestore,auth --project demo-betina
# .env.local:  VITE_USE_EMULATOR=1  VITE_FB_PROJECT_ID=demo-betina  VITE_FB_API_KEY=demo
npm run dev
```
