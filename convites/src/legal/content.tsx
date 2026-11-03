import type { ReactNode } from 'react'

// MODELOS de termos. Antes de vender em escala, peça a um advogado para revisar e preencher os dados do responsável.
const NAME = (import.meta.env.VITE_OPERATOR_NAME as string | undefined) || 'o responsável pelo serviço'
const EMAIL = (import.meta.env.VITE_OPERATOR_EMAIL as string | undefined) || 'contato@seudominio.com.br'

export type LegalDoc = 'termos' | 'privacidade' | 'presentes'

export const LEGAL_TITLE: Record<LegalDoc, string> = {
  termos: 'Termos de uso do convite digital',
  privacidade: 'Política de privacidade',
  presentes: 'Termos da loja de presentes',
}

const H = ({ children }: { children: ReactNode }) => <h3>{children}</h3>

export function LegalBody({ doc }: { doc: LegalDoc }) {
  if (doc === 'presentes') return <Presentes />
  if (doc === 'privacidade') return <Privacidade />
  return <Termos />
}

function Termos() {
  return (
    <>
      <p><i>Atualizado em 2026. Texto-modelo, sujeito a revisão jurídica.</i></p>
      <H>1. O que é o serviço</H>
      <p>O convite digital é um site e um painel de gestão de convidados oferecidos por {NAME} ao anfitrião (“você”) para divulgar o evento, receber confirmações de presença e enviar lembretes por WhatsApp. O envio das mensagens é feito por você, pelo seu próprio WhatsApp.</p>
      <H>2. Acesso e senha</H>
      <p>Você recebe um acesso com e-mail e uma senha provisória, que deve ser trocada no primeiro uso. Guarde sua senha e não a compartilhe. Quem entrar com ela é tratado como você. Para recuperar o acesso, use “Esqueci a senha”.</p>
      <H>3. Conteúdo que você envia</H>
      <p>Você declara ter direito de usar as fotos, textos e nomes que fornece e ter autorização das pessoas retratadas, em especial de crianças (pelos responsáveis legais). Não é permitido conteúdo ilegal, ofensivo, enganoso ou que viole direitos de terceiros. Podemos retirar conteúdo que descumpra estes termos.</p>
      <H>4. Dados dos convidados</H>
      <p>Você decide quais convidados cadastrar e é o responsável por esses dados perante a LGPD; {NAME} atua apenas para operar o serviço. Use os telefones e nomes somente para o evento. Ao importar a lista, garanta que tem o direito de contatar essas pessoas.</p>
      <H>5. Preço e pagamento</H>
      <p>O valor do serviço é o combinado com você antes do início do trabalho. O serviço não cobra comissão sobre presentes (ver termos da loja de presentes).</p>
      <H>6. Disponibilidade e suporte</H>
      <p>Trabalhamos para manter o convite no ar, mas não garantimos funcionamento ininterrupto. Em caso de problema próximo ao evento, fale conosco pelo WhatsApp combinado. Recomendamos baixar a lista de convidados (PDF e planilha) antes do evento.</p>
      <H>7. Fim do serviço e exclusão dos dados</H>
      <p>Após o evento, os dados dos convidados são mantidos por até 90 dias para consulta e depois apagados, salvo pedido seu de exclusão antes disso.</p>
      <H>8. Responsabilidade</H>
      <p>Não nos responsabilizamos por informações incorretas fornecidas por você, por falhas de internet, de WhatsApp ou de serviços de terceiros, nem por decisões dos convidados. Nossa responsabilidade fica limitada ao valor pago pelo serviço, na medida permitida em lei.</p>
      <H>9. Lei aplicável</H>
      <p>Estes termos seguem a lei brasileira. Contato: {EMAIL}.</p>
    </>
  )
}

function Presentes() {
  return (
    <>
      <p><i>Recurso opcional. Texto-modelo, sujeito a revisão jurídica.</i></p>
      <H>1. Como funciona</H>
      <p>Ao ligar a loja de presentes, o convite mostra aos convidados itens e cotas e o Pix “copia e cola” da conta que <b>você</b> cadastrou. O pagamento é feito pelo convidado no próprio banco e cai <b>direto na sua conta</b>. O serviço não recebe, não guarda, não repassa e não processa pagamentos, e não cobra comissão.</p>
      <H>2. Sua chave Pix</H>
      <p>Cadastre apenas uma chave Pix <b>em seu nome</b> (ou do cônjuge) e confira o nome do recebedor mostrado no banco. Você é o único responsável pela chave informada e por eventuais erros de digitação. Não use a loja para arrecadar valores para terceiros ou para outra finalidade que não o seu evento.</p>
      <H>3. Presentes são doações</H>
      <p>O que os convidados enviam é um ato de liberalidade a você. Eles não compram nada do serviço nem de você. A confirmação do recebimento é manual: o convidado avisa que enviou e você confere no seu banco antes de marcar como recebido.</p>
      <H>4. Impostos e obrigações</H>
      <p>Doações em dinheiro podem ter reflexos fiscais (por exemplo, imposto estadual sobre doações, conforme a legislação do seu estado). Verifique suas obrigações com um contador. O serviço não presta aconselhamento fiscal.</p>
      <H>5. Problemas com pagamentos</H>
      <p>Pix enviado errado, estorno ou contestação devem ser tratados entre o convidado, o banco e você. Podemos suspender a loja se houver indício de fraude ou uso indevido.</p>
      <H>6. O que o convidado vê</H>
      <p>Itens e valores, o nome do recebedor e o código Pix. Nome e recado do convidado só aparecem para você (quem marcar “prefiro não aparecer” não é identificado aos outros convidados).</p>
    </>
  )
}

function Privacidade() {
  return (
    <>
      <p><i>Atualizado em 2026. Texto-modelo, sujeito a revisão jurídica.</i></p>
      <H>Quem somos</H>
      <p>O convite digital é operado por {NAME}. O anfitrião do evento define quem é convidado e é o controlador dos dados dos convidados; {NAME} é a operadora que mantém o sistema.</p>
      <H>Quais dados usamos</H>
      <ul>
        <li><b>Convidados:</b> nome e, quando o anfitrião informa, telefone (visível só ao anfitrião). Sua resposta de presença e, para crianças, a idade.</li>
        <li><b>Presentes:</b> nome que você digitar, recado, valor e item escolhido. Nenhum dado de pagamento passa por aqui.</li>
        <li><b>No seu aparelho:</b> guardamos o seu nome para reconhecer você na próxima visita (armazenamento local).</li>
      </ul>
      <H>Para quê</H>
      <p>Para mostrar o convite, registrar sua presença e permitir que o anfitrião organize a festa. Não vendemos dados nem os usamos para publicidade.</p>
      <H>Com quem compartilhamos</H>
      <p>Com o anfitrião do evento e com a Google (Firebase), provedora da infraestrutura onde os dados ficam armazenados.</p>
      <H>Por quanto tempo</H>
      <p>Até 90 dias após o evento, salvo pedido de exclusão anterior.</p>
      <H>Seus direitos</H>
      <p>Você pode pedir acesso, correção ou exclusão dos seus dados ao anfitrião ou diretamente a {EMAIL}. Menores de idade são cadastrados e respondem por meio dos responsáveis.</p>
    </>
  )
}
