# Silhueta · versão 1.8

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
