# Silhueta · versão 2.9.9 — clareza e agilidade no acompanhamento

Aplicativo web instalável (PWA) para acompanhar medidas corporais, composição corporal, nutrição e evolução.

A versão 2.9.9 substitui o roxo das cores de sistema por `#FCFAFD`, o mesmo fundo claro da página. O HTML e o manifest passam a informar a mesma cor de tema, com esquema claro explícito, e o fundo de abertura também fica alinhado à interface. As barras do Android mantêm os controles do sistema. A atualização dessas cores na instalação existente é aplicada pelo Chrome; a identidade, os ícones e os dados permanecem preservados.

A versão 2.9.8 mostra a última medição da região no **Registro rápido**, com valor, unidade e data real. A referência muda ao selecionar uma região e acompanha alterações, exclusões e restaurações do histórico, sem preencher o novo valor nem modificar a data ou as observações em edição. Regiões sem histórico são identificadas, sem tratar o peso do perfil como pesagem. A confirmação após salvar ou editar uma medição informa a região, o valor e a data por cinco segundos; uma falha no armazenamento local exibe uma mensagem de recuperação em vez de confirmar o salvamento.

A versão 2.9.7 acrescenta o horário da última sincronização confirmada neste aparelho, a ação **Desfazer** por dez segundos após excluir uma medição e a memória da última região usada no registro rápido. Essa memória guarda apenas a região, sem reaproveitar valores, datas ou observações. As instruções de instalação ficam ocultas quando o Silhueta está aberto como aplicativo. Não há um novo aviso de atualização.

O horário de confirmação é salvo localmente após a leitura de verificação do Gist e fica associado ao Gist confirmado; não vem de backups importados nem é enviado aos outros dispositivos. Uma falha mantém a confirmação anterior como histórico, sem indicar uma nova confirmação. Desconectar ou reiniciar o aparelho limpa esse histórico local. A ação Desfazer preserva o identificador, a data, o valor e as observações da medição e cria uma alteração mais recente que seu marcador de exclusão; uma versão remota mais recente não é sobrescrita. Os testes usam Gists e tokens sintéticos interceptados, sem acessar dados ou credenciais pessoais.

A versão 2.9.6 corrige a separação entre a data e a ação de salvar em Configurações, o espaço antes das observações de Nutrição e o alinhamento de campos com rótulos de alturas diferentes. As metas alimentares se adaptam à largura do cartão e botões de formulários permitem quebra de linha. A auditoria cobre os formulários expandidos e as telas principais em dez larguras, de 320 a 1440 pixels.

## Atualização da versão
A versão exibida ao final de **Configurações** vem de `APP_VERSION` em `index.html`. Em cada atualização, execute `node scripts/release.mjs patch` (ou uma versão X.Y.Z maior). O comando também atualiza o cache PWA e este README. A URL do manifest e a identidade de instalação permanecem fixas. A integração contínua verifica a consistência com `node scripts/release.mjs --check`.

A marca usada dentro do app é `icons/brand-mark.svg`, sem fundo e com os traços da silhueta aprovada. Os ícones de instalação permanecem nos arquivos originais.

## Identidade de instalação e atualizações PWA
O manifest tem URL fixa (`./manifest.webmanifest`), `id` explícito (`/Silhueta/index.html`) e os mesmos `start_url` e `scope` das versões anteriores. O `id` corresponde à identidade original calculada a partir do endereço de início; não deve ser trocado por versão. O service worker busca o manifest pela rede, mantendo uma cópia para uso offline e aceitando os endereços com query de versões antigas. O registro não reutiliza o cache HTTP do script do service worker.

A auditoria `qa/pwa-install-audit.mjs` verifica a identidade calculada pelo Chromium, critérios de instalação, migração do worker 2.9.3, metadados desatualizados em cache e preservação de registros. Esses testes não executam o instalador WebAPK de um aparelho Android físico.

Referências: [identidade de PWAs no Chrome](https://developer.chrome.com/docs/capabilities/pwa-manifest-id) e [atualizações do manifest no Chrome](https://web.dev/articles/manifest-updates).

## Publicação
Hospedado no GitHub Pages: https://sosoft142.github.io/Silhueta/

## Como começar
1. Em **Medidas**, escolha a região e informe o valor e a data. O histórico fica logo após o formulário, e o guia anatômico pode ser aberto quando necessário.
2. Consulte o painel em **Início** e toque nos pontos dos gráficos em **Evolução** para ver valores e datas completos.
3. Use **Nutrição** para os registros semanais opcionais. Defina a data inicial em **Configurações** para associar as semanas ao calendário.
4. O cabeçalho informa se os dados estão salvos neste aparelho ou sincronizados com a nuvem.

## Sincronização entre celular e computador
1. Abra o ícone de nuvem nos dois aparelhos.
2. Informe **o mesmo Personal Access Token (classic)** do GitHub com a permissão `gist` em ambos.
3. Toque **Conectar e sincronizar** uma vez em cada aparelho.
4. Após a conexão, as alterações são enviadas automaticamente depois de salvar, e o aplicativo busca atualizações ao abrir, retomar a tela e periodicamente enquanto estiver ativo.
5. A indicação **Sincronizado** informa que este aparelho confirmou seu estado com o Gist. Ele não significa que outro dispositivo desconectado já recebeu as alterações.

**Importante:** caso tenha utilizado uma senha de criptografia adicional na versão antiga, faça um backup JSON no dispositivo antigo para migrar os dados. Nunca inclua tokens, Gists ou backups pessoais neste repositório. Tokens armazenados localmente podem ser expostos se o dispositivo estiver comprometido. Faça backups JSON independentes.

O aplicativo preserva alterações em campos diferentes durante a mesclagem. Se o mesmo campo for modificado simultaneamente, utiliza o horário da última edição; não há resolução avançada de conflitos nem garantia de atualização instantânea enquanto o aplicativo está fechado.

## Instalação no Android
Abra **Configurações → Instalar Silhueta** no próprio app. O botão fica disponível quando o navegador emite `beforeinstallprompt` e abre a confirmação de instalação diretamente. Cada oferta é usada uma única vez; cancelamentos e falhas aguardam uma nova oferta. A instalação exige HTTPS, fornecido pelo GitHub Pages.

No Chrome 155, a tela **Instalar e criar atalho** pode informar incorretamente que uma PWA já está instalada e falhar ao abri-la. O [Chromium 568841400](https://issues.chromium.org/issues/568841400) documenta essa regressão. No [código do Chrome 155.0.8059.84](https://github.com/chromium/chromium/blob/155.0.8059.84/chrome/android/java/src/org/chromium/chrome/browser/webapps/AppInstallMenuHandler.java), esse menu consulta a origem inteira. O fluxo interno de instalação verifica o endereço de início em `WebappsClientAndroid::DoesNewWebAppConflictWithExistingInstallation`, permitindo tentar a instalação sem passar por aquela tela do menu. Isso é um contorno; a correção do registro de aplicativos pertence ao navegador.

O app não salva uma marca permanente de “instalado”. Aceitar o diálogo ou receber `appinstalled` indica que o navegador recebeu o pedido; no Android, a criação do WebAPK ainda pode estar em andamento. A interface informa **Instalação solicitada**, sem prometer que o pacote já foi instalado. A abertura em modo standalone é reconhecida separadamente.

Os cenários de instalação da auditoria mobile simulam os eventos do navegador para verificar o botão, a preservação de rascunhos e registros, cancelamento, nova tentativa e falhas. Eles não executam nem comprovam a instalação em um aparelho Android físico. Referência: [experiência de instalação dentro do app](https://web.dev/articles/customize-install).

## Tecnologias
HTML, CSS, JavaScript, localStorage, Service Worker, Web Crypto API e GitHub Gist.

Não depende de servidor próprio, não sincroniza automaticamente com Google Sheets e não coloca credenciais no repositório.

## Dados iniciais: sem exemplos (v1.6)

- Uma instalação nova começa com **perfil, metas nutricionais e medições vazios**. A duração de acompanhamento de 12 meses é a estrutura do projeto, não um dado corporal.
- O peso preenchido em **Meu perfil** é uma referência e **não é automaticamente registrado como pesagem semanal**. O painel apresenta essa referência, identificada como tal, até uma medição real ser salva.
- Ao abrir dados legados de versões anteriores, o aplicativo retira os valores originalmente preenchidos como demonstração **somente quando coincidem com os padrões antigos e não há marca de edição**. Valores pessoais diferentes, como peso inicial de 75 kg, são preservados.
- A migração também é aplicada à leitura de backups antigos recebidos via Gist e aos arquivos JSON importados. Registros reais de medidas e alimentação são preservados. Se algum campo pessoal coincidia exatamente com um exemplo antigo, sem histórico de edição, talvez seja necessário informá-lo novamente.
- O estado permanece exclusivamente no dispositivo e no Gist criptografado do usuário; não existem dados pessoais no repositório.
- Recomenda-se exportar um **backup JSON** antes da primeira sincronização após a atualização.

## Interface e correção de dados (v1.7)

- No computador, use a seta ao lado da marca para recolher ou expandir a barra lateral. A preferência é guardada somente neste navegador.
- O botão de ajuda redundante no canto superior direito foi removido. A seção **Como usar** permanece na barra lateral e agora também na navegação inferior do celular.
- A migração identifica o antigo registro de demonstração de **70 kg na semana zero**, mesmo quando a data foi alterada junto com o projeto ou quando um backup Gist reintroduz esse dado. A remoção registra a exclusão nos relógios de sincronização, para impedir que versões antigas a restaurem.
- Registros semanais com medidas adicionais (por exemplo, cintura ou quadril) e pesagens diferentes de 70 kg não são removidos por essa regra. Se você registrou deliberadamente **70 kg como única medida da semana inicial em uma versão antiga**, confira o registro após atualizar, pois sua origem não pode ser distinguida automaticamente do exemplo original.
- Antes da migração, é recomendável exportar um backup JSON em **Como usar**.

## Revisão técnica da versão 1.8

- **Data da medição preservada:** alterar o início do projeto não modifica mais a data efetivamente registrada para a semana 0.
- **Reiniciar este aparelho:** a opção agora desconecta o token e apaga somente os dados locais. O backup Gist existente não é apagado nem sobrescrito por um estado vazio. Aguarda a conclusão de operações de sincronização em andamento.
- **PWA offline:** cache versionado para 1.8 e ícones de instalação incluídos entre os recursos armazenados.
- **Testes locais:** navegação e screenshots em 320, 390, 768, 1080 e 1440 px; perfil, medições, nutrição, exportação JSON/CSV, modal, barra lateral, migração de dados fictícios, tombstones e mesclagem de campos independentes.
- **Limitação conhecida:** os Gists são criptografados com uma chave derivada do token usado ao criá-los. Antes de substituir ou revogar o token, exporte um backup JSON dos seus dados. O teste de comunicação com um Gist real depende do token do próprio usuário.

## Experiência de uso — versão 1.9

- **Início:** mostra a próxima ação conforme os dados existentes (configurar perfil, primeira medida ou nova semana). Inclui duas etapas de início, resumo e indicações explícitas de registros versus valores de referência. Gráfico de peso só aparece após duas pesagens reais.
- **Perfil:** concentra dados essenciais visíveis; rotina, objetivos e metas nutricionais ficam em seções opcionais, recolhíveis. O peso de referência não gera pesagem no histórico.
- **Medidas:** primeira tela com data, peso, cintura e quadril; outras medidas e anotações em seção opcional. Mostra semanas já salvas e instruções rápidas para medir.
- **Nutrição:** o check-in semanal aparece antes das referências alimentares; macros detalhados são opcionais, assim como metas nutricionais.
- **Evolução:** começa com uma instrução para criar a primeira medição quando não há registros. Mostra primeiro os gráficos essenciais; indicadores complementares ficam sob expansão.
- **Como usar:** três passos com links, glossário breve, cópias de segurança e ações de manutenção secundárias.
- **Android:** cinco destinos na navegação inferior (Início, Medidas, Evolução, Nutrição e Perfil). Ajuda está disponível pelo painel, perfil e menu lateral no desktop.
- **Acessibilidade:** áreas de toque, tipografia secundária, contraste e rótulos de campos reforçados. A barra lateral retrátil foi preservada no computador.

### Princípios adotados

- [Nielsen Norman Group — 10 heurísticas de usabilidade](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Nielsen Norman Group — estados vazios](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Nielsen Norman Group — divulgação progressiva](https://www.nngroup.com/articles/progressive-disclosure/)
- [Nielsen Norman Group — microcopy informativa](https://www.nngroup.com/articles/3-cs-microcopy/)
- [GOV.UK Design System — páginas de perguntas](https://design-system.service.gov.uk/patterns/question-pages/)
- [Android — navegação e layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns)
- [W3C — WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

### Verificação

Testes de navegação e salvamento em Chromium (larguras de 320, 390, 768 e 1440 pixels); telas com e sem registros; preservação de campos opcionais ocultos nos formulários; checagem de erros JavaScript e ausência de rolagem horizontal. Não constitui um estudo com usuárias reais nem validação contra o Gist da conta pessoal.

## Identidade visual 2.0

- Ícone simplificado com silhueta feminina clara sobre gradiente suave lilás/roxo, inspirado no estilo dos demais aplicativos da tela inicial Android.
- Ícones PNG revisados de 192 px, 512 px e 180 px (Apple), além de uma versão *maskable* de 512 px com fundo preenchido para launchers Android.
- Navegação lateral, barra superior, favicon, manifesto e cache offline utilizam os arquivos versionados v2 para evitar imagens antigas mantidas em cache.
- O SVG foi atualizado para uma versão vetorial equivalente ao novo desenho. A atualização de ícones de PWAs já instalados pode depender do launcher Android: se permanecer o anterior após reiniciar o Chrome, remova o atalho/app e instale-o novamente no menu do Chrome.

## Ícone — Opção A (v2.1)

O ícone escolhido usa o desenho minimalista de busto, cintura e quadril em linhas marfim sobre gradiente lilás-roxo. A marca é a mesma no cabeçalho e na lateral, no favicon, nos atalhos e no Android. Os recursos de instalação foram atualizados para ícones com **fundo preenchido até as bordas**, sem contorno arredondado embutido, e com versão maskable adequada ao recorte do Android. Não há seções de dicas diárias ou mensagens motivacionais.

Para atualizar o ícone na tela inicial do Android, aguarde a atualização do service worker. Em alguns launchers, pode ser preciso remover o atalho/app antigo e instalar novamente pelo Chrome **após confirmar o backup JSON e a sincronização**. O cache está versionado como `silhueta-app-v2.1.0`.

## Medições de outras partes do corpo (v2.2)

- Na aba **Medidas**, alterne entre **Principais** e **Mais medições**. Campos adicionais: busto, abaixo do busto, ombros, abdômen, pescoço, braço relaxado, bíceps contraído, antebraço, coxa e panturrilha.
- Cada medida aceita **uma data própria**, inclusive quando os registros compartilham a mesma semana. As datas individuais de peso, cintura e quadril estão em **Datas diferentes...** na aba Principais.
- No painel **Início**, expanda **Mais medidas do corpo** pela seta: aparecem somente medidas já preenchidas, com o último valor pela **data real da própria medida**. Um registro da semana seguinte não substitui um valor de data anterior.
- Em **Evolução**, escolha qualquer medida adicional preenchida e examine sua curva, sempre sem inventar valores ausentes.
- Os campos e suas datas são preservados nos backups JSON, na exportação/importação CSV e na sincronização criptografada por Gist. Em aparelhos antigos que só têm a data da semana, essa data serve de referência até que a data individual seja informada.
- **Importante:** o projeto conserva um registro por semana. Se duas medições da mesma parte do corpo forem salvas dentro da mesma semana, o último valor editado para aquela semana será mantido; o histórico entre semanas permanece preservado.

### Verificação local
Testes em 320, 390, 768 e 1440 px, incluindo alternância de abas sem perder campos, datas diferentes para busto/bíceps/cintura, ordenação pela data de cada medida (independentemente da semana), persistência local, abertura do painel e visualização das curvas. Não foi realizada conexão com o Gist real da usuária.

## Silhueta 2.3 — novas funcionalidades

**Histórico individual:** as medidas agora são eventos independentes, com identificador e data próprios. É possível registrar duas pesagens no mesmo dia ou várias medidas da mesma região dentro de uma semana, editar e excluir apenas um registro. Cada exclusão cria um marcador sincronizável (tombstone), para evitar que um aparelho desatualizado o restaure.

**Migração de registros:** na primeira abertura da versão 2.3, o histórico semanal anterior é convertido uma única vez, criando identificadores determinísticos por semana e região. Os registros semanais legados continuam preservados no backup JSON, incluindo observações e treinos antigos; as observações podem ser consultadas na página Medidas. Dados de referência não são convertidos em pesagens. As datas individuais de medidas da versão 2.2 são preservadas.

**Painel personalizável:** em **Início → Personalizar painel**, selecione de um a oito indicadores corporais e altere sua ordem com as setas. Cada cartão exibe a última data e o último valor da região, além da diferença para o registro anterior quando disponível. As preferências são sincronizadas pelo Gist.

**Guia anatômico:** na página **Medidas**, um esquema simplificado do corpo e botões de regiões dão acesso a instruções de medição. Selecionar uma região prepara seu campo no registro rápido.

**Registro rápido:** em **Medidas → Registro rápido**, informe região, valor, data e observações opcionais. A alternativa **Várias medidas** cria registros independentes de diferentes regiões com uma data comum. O histórico permite editar e excluir registros individualmente.

**Evolução:** gráficos por data real e filtros de região. Dados ausentes não são interpolados. O CSV exporta data, região, valor, unidade e identificador; o aplicativo continua aceitando CSVs semanais antigos. O backup JSON permanece o formato mais completo.

### Sincronização e segurança

- O Gist mantém o mesmo arquivo criptografado e a mesma autenticação de versões anteriores.
- Cada registro independente é sincronizado atomicamente por identificador. Alterações simultâneas no **mesmo registro** usam o relógio da última edição; não há solução avançada de conflitos.
- **Atualize o Silhueta em todos os dispositivos antes de registrar novas medições.** Um cliente antigo não oferece o novo histórico e pode não tratar corretamente alterações da versão 2.3.
- **Exporte um backup JSON antes da primeira sincronização depois da atualização.** A migração foi testada com dados simulados, mas a conexão com o Gist real da usuária não foi executada nesta sessão.

### Testes locais

Sintaxe JavaScript; renderização e ausência de rolagem horizontal em 320, 390, 768 e 1440 px; inclusão repetida da mesma região, registro de múltiplas regiões, edição e exclusão individual, filtros, favoritos e ordenação, guia anatômico, atualização de perfil, migração de dados da versão 2.2, não duplicação na migração, preservação de datas próprias e simulação de mesclagem entre aparelhos com marcadores de exclusão.

## Auditoria da versão 2.4

- Validação estrita de datas (por exemplo, 30/02 não é mais aceito), sem alterar datas antigas válidas.
- Sincronização automática não interrompe nem substitui um formulário enquanto há alterações locais ainda não salvas. Salve ou descarte os campos antes da sincronização manual.
- Ao navegar para outra tela ou trocar o modo de registro com campos alterados, o aplicativo pergunta se é permitido descartar as informações.
- Textos da ajuda atualizados para descrever o **histórico de medições independentes por data**, sem confundir com o diário semanal de nutrição.
- Guia anatômico melhorado para telas pequenas: fontes e botões maiores, contornos de foco visíveis e áreas de toque ampliadas.

**Verificação:** JavaScript conferido com Node, testes automatizados de formulário, navegação, validação de datas, registros, exclusão, migração e mesclagem de estados com navegadores simulados. Interface revisada no Chromium em 320, 390, 768 e 1440 px, nas seis páginas, sem rolagem horizontal ou erros de execução. Não foi efetuado teste autenticado no Gist pessoal da usuária.

**Backup:** antes de atualizar os dois dispositivos, exporte um JSON em **Como usar** e confirme que os dados estão sincronizados. Os dados pessoais e o token GitHub não estão no repositório.

## Guia anatômico ilustrado (2.5)

- A seção **Guia anatômico**, em **Medidas**, exibe uma ilustração vetorial específica para cada região: busto, abaixo do busto, ombros, pescoço, cintura, abdômen, quadril, braço relaxado, bíceps contraído, antebraço, coxa e panturrilha.
- Selecione uma região pelos botões. A ilustração e as instruções mudam **no próprio guia**, sem mudar de página, sem rolar automaticamente até o formulário e **sem modificar o registro rápido nem perder valores digitados que ainda não foram salvos**.
- A faixa rosa é um indicador **esquemático da posição**; para circunferências, a fita deve contornar todo o corpo ou membro, não apenas a face mostrada.
- Para a **cintura**, as instruções usam o ponto médio entre a costela inferior e a crista ilíaca; para o **quadril**, a maior circunferência dos glúteos, conforme protocolos antropométricos da OMS. Para o abdômen, este aplicativo padroniza o ponto do umbigo, separado da medida de cintura.
- O guia é educativo e não substitui avaliação antropométrica profissional. Meça sempre do mesmo lado, no mesmo ponto e sob condições comparáveis.
- O seletor do guia inclui agora ombros e antebraço, que já estavam disponíveis como campos de medição, mas não tinham ilustrações.
- Nenhuma mudança foi feita na estrutura de registros, migração de histórico, criptografia ou sincronização por Gist.

**Testes locais:** sintaxe de JavaScript no Node; seleção das 12 regiões em Chromium em larguras de 320, 390, 768 e 1440 px; checagem das ilustrações SVG, estados visuais, ausência de erros e de rolagem horizontal; preservação de um valor não salvo durante as seleções; manutenção da posição de rolagem após entrar no guia. O teste não acessou o Gist pessoal da usuária.

Referência: Organização Mundial da Saúde, *Waist Circumference and Waist–Hip Ratio: Report of a WHO Expert Consultation* (https://iris.who.int/handle/10665/44583).

## Atualização 2.6: ilustrações anatômicas lado a lado

- O guia ocupa uma seção de largura total em **Medidas**. Botões de seleção ficam à esquerda e a ilustração correspondente aparece **à direita**, também no Android, sem abrir o formulário.
- Os desenhos vetoriais foram revisados para manter as faixas rosas sobre a região do corpo representada e melhorar a legibilidade.
- A seleção atualiza somente o painel do guia, não redesenha os campos digitados e não altera a rolagem da página.
- As 12 regiões permanecem disponíveis: busto, abaixo do busto, ombros, pescoço, cintura, abdômen, quadril, braço, bíceps, antebraço, coxa e panturrilha.
- O guia usa imagens esquemáticas, não fotografia anatômica ou precisão clínica; orientações textuais contextualizam cada região.
- Nenhuma mudança no modelo de dados, registros históricos, criptografia ou sincronização por Gist.

**Testes realizados:** sintaxe do JavaScript (Node), renderização em Chromium com larguras de 320, 390, 768 e 1440 px, ausência de overflow horizontal, imagem à direita dos seletores, alternância de áreas e persistência de um valor digitado e ainda não salvo no formulário.

## Guia de medições: correções visuais 2.7.1

- As doze ilustrações anatômicas estilizadas são incorporadas ao `index.html` em formato WebP, sem requisições externas de imagens; permanecem disponíveis com o aplicativo em cache offline.
- Nas telas pequenas, a **ilustração fica ao lado** da seleção de regiões. As instruções passam para um bloco de largura total abaixo, com texto maior e maior legibilidade.
- A seleção de regiões possui rolagem independente e texto indicando a existência de outras opções, sem empurrar a ilustração para baixo.
- Foram revistos os destaques de cintura, abdômen, ombros, pescoço e antebraço para se ajustarem à pose da respectiva ilustração. As imagens são representações educativas geradas com auxílio de IA, não referência clínica certificada.
- A troca de região atualiza somente o guia, preservando campos de medições não salvos, sem alterar registros existentes.
- O ícone **Opção A**, a estrutura dos registros corporais e a sincronização por Gist permanecem inalterados.

**Testes executados:** Chromium em 320, 360, 390, 414, 768, 1024 e 1440 pixels; seleção de todas as doze regiões em cada largura; verificação de imagens incorporadas, ausência de rolagem horizontal, erros JavaScript e perda de valores não salvos. A sincronização com um Gist real não foi testada.

**Atualização Android:** feche e reabra o aplicativo instalado pelo Chrome para atualizar o service worker (cache v2.7.1). Antes de reinstalar o PWA, exporte seus registros JSON e confirme a sincronização.

## Versão 2.8 — revisão das 12 ilustrações anatômicas

- Substituímos as imagens do guia por **12 ilustrações com fita métrica rosa**, com uma imagem para cada região corporal e sem círculos ou faixas SVG sobrepostas. A seleção permanece lado a lado e não altera registros ou os campos do formulário.
- Os arquivos PNG individuais de 2048 × 2048 pixels seguem disponíveis no pacote de ilustrações; para melhor desempenho e funcionamento offline, o aplicativo usa versões **WebP 1280 × 1280** incorporadas ao HTML. Os PNG foram ampliados de uma prancha de IA: não têm detalhe nativo equivalente a uma ilustração feita originalmente a 2048 px.
- Mantivemos o ícone escolhido (**Opção A**), os dados e a integração do GitHub Gist.
- Criamos `qa/anatomy-manifest.json`, `qa/check_anatomy.py` e `.github/workflows/anatomy-qa.yml`. O GitHub Actions agora verifica automaticamente: presença e vínculo das 12 imagens, integridade SHA-256, resolução mínima, presença de faixa rosa na área esperada, ausência de marcadores extras, manutenção do ícone e sintaxe JavaScript.
- A checklist anatômica manual fica em **[qa/VISUAL_REVIEW.md](qa/VISUAL_REVIEW.md)**. O teste automático **não substitui** uma avaliação visual humana ou certificação anatômica.
- A versão do cache PWA mudou para **v2.8.0**.

**Verificação desta publicação:** o workflow do GitHub Actions foi executado com sucesso, assim como o deployment GitHub Pages do mesmo commit em que foi introduzido. Também validamos localmente as 12 imagens e sintaxe do JavaScript. O navegador automatizado desta sessão bloqueou a navegação inclusive em páginas locais, portanto **não afirmamos ter executado novos testes interativos do layout nesta versão**; o layout CSS permanece o da 2.7.1.

Recomendação: faça um backup JSON antes de reinstalar o aplicativo no Android e confirme a sincronização Gist em ambos os aparelhos.

## Versão 2.9 — reorganização da interface

- **Perfil saiu da navegação**: Início, Medidas, Evolução e Nutrição são agora as quatro páginas principais.
- **Configurações** (engrenagem) fica na área inferior da **barra lateral do computador**. No Android, abra o menu lateral pelo botão no topo para acessar Configurações e Como usar, sem adicionar ícones à barra inferior.
- **Comece sem perfil:** idade, altura e peso de referência não são obrigatórios para registrar medições; a data de início também é opcional.
- **Nutrição** recebeu um formulário expansível para metas de proteína, carboidrato e gordura, com estimativa de 4/4/9 kcal/g. O consumo registrado permanece independente das metas.
- **Evolução** recebeu metas corporais opcionais (peso, cintura e quadril), comparadas com os últimos registros reais disponíveis.
- **Compatibilidade:** todos os campos antigos do perfil, inclusive idade, altura, peso inicial e informações opcionais, permanecem no estado/backup/Gist, sem serem apagados ou convertidos em medições. A migração não modifica a estrutura de sincronização existente.
- **Proteção de formulário:** detecção de alterações não salvas em todos os formulários, confirmação antes de navegar e checagem adicional quando a resposta da sincronização chega durante uma edição.
- **Sem alteração nas ilustrações e ícone:** as 12 imagens de fita rosa e o ícone Opção A permanecem os mesmos.
- **PWA:** cache atualizado para `silhueta-app-v2.9.0`.

### Testes desta atualização

Chromium com armazenamento local simulado em 320, 390, 768, 1024 e 1440 pixels: navegação, menu lateral móvel, teclado/Escape, registro sem perfil, atualização de data, metas nutricionais, metas corporais, gráficos com dados reais, preservação do histórico antigo, IDs únicos de formulário, datas inválidas e proteção de alterações não salvas. **Todos passaram localmente.** Sintaxe JavaScript verificada com Node.

**Limitações:** não houve acesso autenticado ao Gist pessoal nem teste de instalação em um aparelho Android físico. Como a navegação mudou, exporte um backup JSON antes da primeira sincronização após atualizar os dispositivos e confira o histórico.

**Publicação:** o código no repositório corresponde exatamente ao arquivo da prévia local da versão 2.9; o fluxo do GitHub Actions verifica automaticamente as 12 imagens, seu mapeamento e a sintaxe JavaScript.


## Versão 2.9.1 — correções de dados e interface mobile

- **Rascunhos preservados:** filtros, gráficos e atualização de um formulário mantêm os campos ainda não salvos dos demais formulários. Trocar de registro ou de semana solicita confirmação antes de descartar alterações.
- **Importação validada antes da gravação:** backups JSON e arquivos CSV são processados em uma cópia temporária. Estruturas, datas ou valores inválidos deixam os dados atuais intactos, sem gravação parcial.
- **CSV sem duplicar medições antigas:** identificadores de registros migrados (legacy_) são preservados, inclusive os marcadores de exclusão.
- **Limites consistentes:** registros nutricionais importados e medições em lote seguem as faixas numéricas dos formulários.
- **Gráficos responsivos:** os eixos são desenhados conforme a largura real do cartão, mantendo a fonte legível no celular e ao redimensionar a janela.
- **Textos no mobile:** anotações extensas quebram linha; o seletor de semana exibe a data completa em telas pequenas.
- **Compatibilidade:** armazenamento local, modelo de histórico, referência de peso, ícone Opção A, ilustrações e integração criptografada com Gist foram mantidos. O cache PWA é silhueta-app-v2.9.1.

A rotina de regressão em qa/mobile-input-audit.mjs cobre as seis páginas em 320, 360, 390, 414, 768, 1024 e 1440 pixels, além de preservação de formulários, importações válidas e inválidas, migração, edição/exclusão e legibilidade dos gráficos. O workflow executa automaticamente em alterações pertinentes, com dados fictícios isolados e sem acesso ao Gist pessoal.

A emulação não substitui a verificação em Android físico, do teclado virtual e da sincronização autenticada entre dispositivos.
