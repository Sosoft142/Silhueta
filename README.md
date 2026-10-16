# Silhueta · versão 1.6 — sem dados fictícios

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
