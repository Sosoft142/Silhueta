# Silhueta · versão 1.5

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
