# Produto: o que existe e o que falta

## Pronto (testado)
- Base separada da Betina, sem dados reais e sem acesso ao projeto dela.
- Dados por evento (`events/{id}`) e regras de segurança por evento. Testado com o emulador: busca do convidado, confirmação, presentes, painel e dono.
- Login do cliente por e-mail + senha provisória, com troca obrigatória e "esqueci a senha".
- Loja de presentes opcional (Pix com QR Code, itens reservados, "já enviei", confirmação no painel), com termos.
- Termos de uso, política de privacidade e termos da loja de presentes (modelos).
- Provisionamento por formulário (`cliente.json`): cria evento, convidados, acesso e registro do cliente. Testado no emulador.
- Painel do dono: clientes (com e-mail, aceite dos termos e status do acesso), funil, financeiro, temas, configurações.
- 4 convites-modelo fictícios e demonstração navegável.

## Ainda NÃO testado de ponta a ponta
- Publicação (`--publicar`) e criação de usuário no Firebase real: só foi rodado no emulador. Na primeira vez com um projeto real, rode com `--simular` e confira.
- Envio do e-mail de "esqueci a senha" (depende dos modelos de e-mail do projeto).

## Falta (em ordem sugerida)
1. **Fotos reais de exemplo** (hoje são ilustrações). Ver `PROMPTS-FOTOS-IA.md`.
2. **Criar o projeto Firebase de produção** e rodar o primeiro cliente de verdade (com `--simular` antes).
3. **Páginas de contagem regressiva e imagem "É amanhã"** por cliente (ativadas por `VITE_COUNTDOWN_PAGES=1` e `VITE_TOMORROW_IMAGE=1`; hoje só existem no projeto da Betina).
4. **Revisão jurídica** dos termos e da privacidade; dados do responsável (`VITE_OPERATOR_NAME`, `VITE_OPERATOR_EMAIL`).
5. **Cobrança do serviço** (Pix) e liberação do painel após o pagamento.
6. **Apagar dados** dos convidados 90 dias depois do evento (hoje é manual).
7. **Músicas e fontes** com licença comercial; **não usar personagens licenciados** nos temas vendidos.
8. **Limites do plano gratuito do Firebase** (leituras/escritas por dia) se vários eventos acontecerem no mesmo dia: acompanhar e migrar para o plano pago quando precisar.
