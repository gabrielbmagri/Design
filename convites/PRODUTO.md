# Produto: o que existe e o que falta

## Feito
- Base separada da Betina, sem dados reais e sem acesso ao projeto dela.
- Temas (cores, emojis, fonte) e textos de abertura/contador/anfitriões vindos da configuração.
- 4 convites-modelo fictícios (Safari, Jardim Encantado, Casamento Ouro, Casamento Prata) + demonstração.
- Painel do dono: clientes, funil, financeiro, temas, configurações.

## Falta (em ordem sugerida)
1. **Fotos de exemplo reais** (hoje são ilustrações). Se usar IA, gerar crianças e casais fictícios; não usar fotos de pessoas reais sem autorização.
2. **Prévia do WhatsApp por cliente**: como o site é estático, o título/imagem saem de `VITE_OG_*` + um `og/convite.jpg` por cliente. Falta um gerador de imagem genérico (hoje só existe o da Betina, em `../betina/scripts`).
3. **Páginas de contagem regressiva e imagem "É amanhã"** por cliente (ativadas com `VITE_COUNTDOWN_PAGES=1` e `VITE_TOMORROW_IMAGE=1`).
4. **Um projeto/site por cliente**: automatizar criação e deploy (script).
5. **Cobrança** (Pix) e liberação do painel após pagamento.
6. **Termos e privacidade (LGPD)**; apagar dados dos convidados após o evento; autorização de uso de imagem de crianças.
7. **Músicas e fontes** com licença comercial (a trilha do filme da Betina usa CC BY).
8. **Personagens licenciados** (Peppa, super-heróis, etc.): não usar arte oficial em temas vendidos.
