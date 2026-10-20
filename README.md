# Silhueta · versão 2.6 — guia anatômico lado a lado

Aplicativo web instalável (PWA) para acompanhar medidas corporais, composição corporal, nutrição e evolução.

## Publicação
Hospedado no GitHub Pages: https://sosoft142.github.io/Silhueta/

## Como começar
1. Abra **Meu perfil** e confira idade, altura, peso e metas. Selecione **Salvar meu perfil**.
2. Na aba **Medições**, registre semanalmente peso e circunferências.
3. Veja o progresso na página inicial e os gráficos em **Evolução**.

## Sincronização entre celular e computador
1. Abra o ícone de nuvem nos dois aparelhos.
2. Informe **o mesmo Personal Access Token (classic)** do GitHub com a permissão `gist` em ambos.
3. Toque **Conectar e sincronizar** uma vez em cada aparelho.
4. Após a conexão, as alterações são enviadas automaticamente depois de salvar, e o aplicativo busca atualizações ao abrir, retomar a tela e periodicamente enquanto estiver ativo.
5. O verde indica que **este aparelho confirmou seu estado com o Gist**. Ele não significa que outro dispositivo desconectado já recebeu as alterações.

**Importante:** caso tenha utilizado uma senha de criptografia adicional na versão antiga, faça um backup JSON no dispositivo antigo para migrar os dados. Nunca inclua tokens, Gists ou backups pessoais neste repositório. Tokens armazenados localmente podem ser expostos se o dispositivo estiver comprometido. Faça backups JSON independentes.

O aplicativo preserva alterações em campos diferentes durante a mesclagem. Se o mesmo campo for modificado simultaneamente, utiliza o horário da última edição; não há resolução avançada de conflitos nem garantia de atualização instantânea enquanto o aplicativo está fechado.

## Instalação no Android
No Chrome, abra o site e acesse o menu ⋮ → **Instalar aplicativo** (ou **Adicionar à tela inicial**, conforme a versão). A instalação exige HTTPS, fornecido pelo GitHub Pages.

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
