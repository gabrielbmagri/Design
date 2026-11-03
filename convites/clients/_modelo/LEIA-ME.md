# Como cadastrar um cliente

1. Copie esta pasta: `clients/_modelo` → `clients/<id-do-cliente>` (ex.: `clients/theo-2027`).
2. Preencha `cliente.json` com o que o cliente respondeu no WhatsApp (o formulário está em `FORMULARIO-WHATSAPP.md`).
3. Coloque as fotos em `clients/<id>/fotos/` com os nomes que usou no JSON (`01.jpg` … `06.jpg`, `convite.jpg`).
4. Teste sem gravar nada: `npm run cliente -- clients/<id>/cliente.json --projeto <projeto> --simular`
5. Crie tudo: `npm run cliente -- clients/<id>/cliente.json --projeto <projeto> --publicar`
   - cria o evento, os convidados, o acesso (e-mail + senha provisória) e o registro no seu painel;
   - `--publicar` monta e publica o site do cliente (um site de hospedagem por cliente);
   - `--aleatoria` gera uma senha diferente por cliente; `--atualizar` reescreve só a configuração de um evento que já existe.
6. Mande ao cliente o convite, o painel, o e-mail e a senha provisória (o botão "Enviar links" do seu painel já monta a mensagem).

A pasta `clients/` (exceto `_modelo`) não vai para o Git: tem nomes, telefones e fotos de clientes.
