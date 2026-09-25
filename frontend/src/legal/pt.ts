// Textos legais em português (mesmo conteúdo que es.ts)
import type { LegalDocs } from './index';

const MAIL = '[gastos@cabrasky.net](mailto:gastos@cabrasky.net)';

const pt: LegalDocs = {
  privacidad: {
    title: 'Política de privacidade',
    intro: 'O miBolsillo é um projeto pessoal e gratuito para registar as tuas despesas. Aqui explica-se que dados guarda, para quê, com quem são partilhados e como os podes apagar. Em resumo: os teus dados só são usados para a app funcionar. Não há publicidade, nem análise, nem venda de dados, e podes eliminar a tua conta com todo o seu conteúdo quando quiseres.',
    sections: [
      { h: 'Responsável', p: [[
        '**Responsável pelo tratamento:** Javier Mateos.',
        `**Contacto:** ${MAIL}.`,
        '**Onde estão os teus dados:** num servidor gerido pelo próprio responsável, em Espanha (União Europeia).',
      ]] },
      { h: 'Que dados guardamos', p: [[
        '**Dados da conta:** nome e email. A palavra-passe é guardada só como hash bcrypt, nunca em texto simples. Também a foto de perfil, se indicares um endereço, e o teu identificador Google, se entrares com o Google.',
        '**Preferências:** idioma, tema e orçamento semanal.',
        '**O que registas na app:** despesas (valor, data, descrição, categoria, método de pagamento…), fotos de talões que carregues, receitas, metas de poupança, assinaturas, projetos e categorias próprias.',
        '**Pessoas com quem partilhas despesas:** os nomes que escreves e o que te devem ou já te devolveram.',
        '**Chaves de API** do modo programador: só se guarda a sua impressão digital (hash), não a chave.',
        '**Dados técnicos:** endereço IP, data e caminho de cada pedido, nos registos do servidor, para a segurança e para resolver erros.',
      ], 'Não pedimos dados bancários nem nos ligamos ao teu banco.'] },
      { h: 'Para quê e com que base legal', p: [[
        '**Prestar o serviço:** criar a tua conta, guardar e sincronizar os teus dados entre a web e a app, e enviar-te o email para recuperar a palavra-passe. É necessário para cumprir os [Termos de utilização](/legal/terminos) que aceitas ao registar-te (art. 6.º, n.º 1, al. b) do RGPD).',
        '**Segurança e funcionamento:** guardar registos técnicos e evitar abusos, por interesse legítimo em manter o serviço seguro (art. 6.º, n.º 1, al. f) do RGPD).',
      ], 'Não usamos os teus dados para publicidade nem para criar perfis. Não há análise nem rastreio, e os teus dados não são vendidos nem cedidos a ninguém.'] },
      { h: 'Com quem são partilhados', p: [
        'Apenas nestes casos, e só se usares a função correspondente:',
        [
          '**Google**, se escolheres «Continuar com o Google»: o Google identifica-te e envia-nos o teu nome, email e foto. A Google LLC pode tratar dados nos EUA ao abrigo do Quadro de Privacidade de Dados UE-EUA; aplica-se também a [política de privacidade da Google](https://policies.google.com/privacy).',
          '**Cuentas Claras** (cuentas-claras.cabrasky.net), se enviares para lá uma despesa partilhada: são enviados o título, a data, os valores, os nomes das pessoas da divisão e o teu email. É um serviço do mesmo responsável, e o que enviares é gerido nessa app.',
          '**Email:** os emails de recuperação da palavra-passe são enviados a partir de um servidor de correio próprio (mail.cabrasky.net).',
        ],
        'A web não carrega recursos de terceiros: as fontes e restantes ficheiros são servidos a partir do nosso próprio servidor. Só seriam dados dados a uma autoridade se a lei o exigisse.',
      ] },
      { h: 'Dados de outras pessoas', p: [
        'Se registares nomes de outras pessoas em despesas partilhadas, fá-lo com o conhecimento delas e limita-te ao necessário: basta um nome ou uma alcunha. Esses dados só são usados dentro da tua conta.',
      ] },
      { h: 'Durante quanto tempo os guardamos', p: [[
        'Os teus dados são conservados enquanto tiveres conta.',
        'Se **eliminares a conta**, são apagados de imediato da base de dados: a conta, as despesas, as fotos, as receitas, as metas, as assinaturas, os projetos, as categorias e as chaves de API. As cópias de segurança renovam-se automaticamente, e os dados apagados desaparecem delas em **30 dias, no máximo**.',
        'Os registos técnicos do servidor são apagados com a sua rotação automática.',
      ]] },
      { h: 'Os teus direitos', p: [
        'Tens direito de **acesso, retificação, apagamento, oposição, limitação e portabilidade**. Podes exercê-los assim:',
        [
          'Na app: em **Configurações** podes editar os teus dados, exportar as tuas despesas (CSV ou Excel) e **eliminar a tua conta** com todos os seus dados.',
          `Por email para ${MAIL}, para qualquer outro pedido.`,
        ],
        'Se achares que os teus dados não foram bem tratados, podes apresentar reclamação à Agência Espanhola de Proteção de Dados ([aepd.es](https://www.aepd.es)).',
      ] },
      { h: 'Segurança', p: [
        'As ligações são cifradas (HTTPS), as palavras-passe são guardadas com hash e o acesso ao servidor é restrito. Nenhum sistema é infalível, por isso usa uma palavra-passe que não uses noutros sítios.',
      ] },
      { h: 'App móvel', p: [
        'A app Android guarda no telemóvel uma cópia dos teus dados para funcionar sem ligação, e sincroniza as alterações quando a rede volta. Essa cópia é apagada ao terminar sessão ou ao eliminar a conta. A app é descarregada a partir desta web e consulta-a para saber se há versões novas.',
      ] },
      { h: 'Conta demo', p: [
        'A demo da [página inicial](/) é uma conta pública de exemplo e só de leitura: não guarda dados de quem a experimenta. O idioma ou o tema que escolheres nela ficam apenas no teu navegador.',
      ] },
      { h: 'Menores', p: ['O miBolsillo não se destina a menores de 14 anos.'] },
      { h: 'Alterações', p: ['Se esta política mudar, a nova versão será publicada aqui com a data atualizada.'] },
    ],
  },

  cookies: {
    title: 'Política de cookies',
    intro: 'O miBolsillo não usa cookies de publicidade, nem de análise, nem de terceiros. Guarda no navegador apenas o indispensável para a app funcionar e lembrar as tuas preferências. Por isso não precisa de pedir consentimento nem de mostrar um aviso de cookies.',
    sections: [
      { h: 'O que são', p: [
        'Os cookies e o armazenamento local são pequenos dados que um site guarda no teu navegador para os lembrar na visita seguinte.',
      ] },
      { h: 'Cookies que usamos', p: [
        'São todos próprios e duram 1 ano:',
        [
          '**mb_locale**: o idioma escolhido.',
          '**mb_theme**: o tema (sistema, claro ou escuro).',
          '**mb_weekly_goal**: o orçamento semanal usado no resumo.',
        ],
      ] },
      { h: 'Armazenamento local', p: [
        'Com sessão iniciada também se usa o armazenamento local do navegador. Não são cookies e não são enviados sozinhos para o servidor:',
        [
          '**gastos_token**: a tua sessão, para não teres de entrar em cada visita. Dura até terminares sessão.',
          '**gastos_user**: o teu nome e as tuas preferências, para os mostrar logo ao abrir. Dura até terminares sessão.',
          '**gastos_app_data**: uma cópia dos teus dados para a app carregar depressa. É apagada ao terminar sessão ou ao eliminar a conta.',
        ],
        'As chaves de versões anteriores (gastos_locale, gastos_dark, gastos_goal e gastos_layout_pin) são apagadas automaticamente ao abrir a web.',
      ] },
      { h: 'Porque não há aviso de cookies', p: [
        'São todos técnicos ou de personalização escolhida por ti, e servem para prestar o serviço que pedes. Por isso estão isentos de consentimento (art. 22.2 da LSSI espanhola e guia de cookies da AEPD). Não há cookies de terceiros: nem análise, nem publicidade, nem redes sociais. As fontes são servidas a partir do nosso próprio servidor.',
        'Se entrares com o Google, a página de início de sessão é do Google e usa os seus próprios cookies, segundo a sua política.',
      ] },
      { h: 'Como os apagar', p: [
        'Ao terminar sessão, apagam-se a sessão e a cópia dos teus dados. Para apagar também as preferências, elimina os cookies e os dados do site nas definições do navegador. A app continuará a funcionar, mas terás de voltar a entrar e a escolher as tuas preferências.',
      ] },
    ],
  },

  'aviso-legal': {
    title: 'Aviso legal',
    intro: 'Estes são os dados do titular deste site, de acordo com o artigo 10.º da lei espanhola de serviços da sociedade da informação (Ley 34/2002, LSSI).',
    sections: [
      { h: 'Titular', p: [[
        '**Titular:** Javier Mateos.',
        `**Contacto:** ${MAIL}.`,
        '**Site:** mibolsillo.cabrasky.net.',
        '**Atividade:** projeto pessoal, gratuito e sem fins lucrativos para controlar despesas pessoais. Não tem atividade comercial nem publicidade.',
      ]] },
      { h: 'Utilização do site', p: [
        'Usar a web e a app implica aceitar este aviso e os [Termos de utilização](/legal/terminos). O tratamento dos dados é explicado na [Política de privacidade](/legal/privacidad) e o uso de cookies na [Política de cookies](/legal/cookies).',
      ] },
      { h: 'Propriedade intelectual', p: [
        'O design, os textos, o logótipo e o código do miBolsillo pertencem ao seu titular, exceto os componentes de código aberto, que mantêm as suas licenças. Os teus dados são teus: podes exportá-los e eliminá-los quando quiseres.',
      ] },
      { h: 'Responsabilidade', p: [
        'O miBolsillo serve para organizar as tuas finanças pessoais, mas não é aconselhamento financeiro, fiscal nem contabilístico. O titular procura que funcione bem e sem interrupções, mas não garante que não haja erros. Na medida em que a lei o permita, não responde pelas decisões que tomes com a informação da app nem pelos danos causados por falhas técnicas.',
      ] },
      { h: 'Ligações', p: [
        'As ligações para sites de terceiros, como o Google ou a AEPD, são oferecidas por comodidade; o titular não controla o seu conteúdo.',
      ] },
      { h: 'Lei aplicável', p: [
        'Este aviso rege-se pela lei espanhola. Se fores consumidor, podes recorrer aos tribunais do teu domicílio.',
      ] },
    ],
  },

  terminos: {
    title: 'Termos de utilização',
    intro: `Estas condições regulam a utilização do miBolsillo, tanto a web como a app Android. Ao criar uma conta aceita-las. São curtas de propósito; se algo não estiver claro, escreve para ${MAIL}.`,
    sections: [
      { h: 'O serviço', p: [
        'O miBolsillo permite-te registar despesas, receitas, metas, assinaturas e projetos, partilhar despesas e ver estatísticas. É gratuito, não tem publicidade e é oferecido «tal como está». Pode mudar ou melhorar e, com aviso razoável, poderá deixar de ser oferecido.',
      ] },
      { h: 'A tua conta', p: [[
        'Precisas de ter 14 anos ou mais.',
        'Usa um email válido e uma palavra-passe segura. És responsável pelo que for feito com a tua conta.',
        'Podes sair quando quiseres em **Configurações → Eliminar conta**: a tua conta e todos os teus dados são apagados.',
      ]] },
      { h: 'Utilização correta', p: [
        'Não uses o miBolsillo para nada ilegal. Não tentes aceder a dados de outros utilizadores, não ataques nem sobrecarregues o serviço e não abuses da API. Se registares nomes de outras pessoas, fá-lo com o conhecimento delas. O titular pode suspender as contas que não cumpram estas regras.',
      ] },
      { h: 'Os teus dados', p: [
        'O conteúdo que introduzes é teu. O titular só o usa para prestar o serviço, como explica a [Política de privacidade](/legal/privacidad). Podes exportá-lo em CSV ou Excel.',
      ] },
      { h: 'Conta demo', p: [
        'A demo é uma conta pública só de leitura com dados de exemplo, que se renovam todos os dias. Não pode ser alterada nem eliminada.',
      ] },
      { h: 'Sem garantias', p: [
        'A informação da app é indicativa, depende do que registares e não é aconselhamento financeiro. Procura-se que tudo funcione, mas pode haver erros, perdas de dados ou interrupções, por isso exporta os teus dados de vez em quando. Na medida em que a lei o permita, o titular não responde pelos danos indiretos que resultem da utilização da app.',
      ] },
      { h: 'Alterações', p: [
        'Se estes termos mudarem, a nova versão será publicada aqui com a sua data. Se continuares a usar a app depois disso, entende-se que aceitas as alterações. Se não concordares, podes eliminar a tua conta.',
      ] },
      { h: 'Lei aplicável', p: [
        'Estes termos regem-se pela lei espanhola. Se fores consumidor, podes recorrer aos tribunais do teu domicílio.',
      ] },
    ],
  },
};

export default pt;
