# Silhueta — acompanhamento corporal (PWA) · v1.2

Aplicativo estático e responsivo para acompanhar medições, treinamento, nutrição e gráficos de evolução por 53 semanas. O ícone instalado utiliza a identidade visual vinho com uma nuvem minimalista. A janela **Sincronização** está acessível pela nuvem verde no topo do aplicativo.

## Publicação no GitHub Pages

1. Crie um repositório (por exemplo, `silhueta`) em https://github.com/new.
2. Envie o **conteúdo da pasta**, não a pasta inteira, para a raiz do repositório. A raiz precisa conter `index.html`, `manifest.webmanifest`, `service-worker.js`, `.nojekyll`, `README.md` e a pasta `icons/`.
3. Nas configurações do repositório, abra **Settings → Pages** e escolha **Deploy from a branch**, `main`, `/(root)`.
4. Aguarde a URL HTTPS do GitHub Pages. Abra o site no celular e escolha **Adicionar à tela inicial** ou **Instalar**, conforme o navegador.
5. Se já instalou uma versão antiga do Silhueta, talvez seja necessário remover o atalho/PWA anterior e instalá-lo novamente para atualizar o ícone e o nome (o cache do navegador pode retardar a mudança).

Não há etapa de `npm install` nem compilação.

## Sincronização via Gist

1. Crie um **Personal Access Token (classic)** em https://github.com/settings/tokens/new com **somente a permissão `gist`**.
2. Abra o Silhueta pelo GitHub Pages (HTTPS). Clique no botão de **nuvem verde** no topo.
3. Insira o token. Opcionalmente marque **Lembrar token neste dispositivo** (não recomendado em dispositivos compartilhados).
4. Clique em **Salvar e sincronizar**. O aplicativo tentará localizar automaticamente um Gist do Silhueta. Se nenhum existir, criará um Gist secreto e armazenará um backup criptografado. **Enviar** substitui o backup remoto, com confirmação. **Receber** substitui os dados locais, também com confirmação.
5. Em outro celular ou computador, abra o Silhueta e utilize o mesmo token; clique em **Receber**. Se houver mais de um Gist do Silhueta, configure manualmente o ID em **Avançado**.
6. Se você **já tinha um Gist cifrado com senha adicional** na versão 1.1, expanda **Avançado** e informe essa mesma senha para continuar utilizando-o.

**Atenção:** a sincronização é **manual** (não em tempo real), e não resolve conflitos de edições concorrentes. Sempre receba os dados atualizados antes de editar em outro aparelho. Um Gist "secreto" **não é privado**; qualquer pessoa com o link pode acessar o arquivo criptografado. O GitHub recebe apenas o conteúdo cifrado e não a senha. A cifra utilizada é AES-256-GCM, com chave derivada via PBKDF2-SHA256 e salt aleatório.

No modo padrão, a chave de criptografia é derivada do **token**. Portanto, **perder ou revogar esse token sem manter um backup JSON independente pode inviabilizar a recuperação dos dados**. Para maior segurança contra comprometimento do token, configure uma senha **adicional exclusiva** em Avançado; nesse caso, preserve também a senha, pois ela será necessária em outros aparelhos. Não use um token como senha em outros serviços. Armazenar o token no navegador (quando autorizado) melhora a conveniência, mas aumenta o risco em dispositivos compartilhados ou infectados. O token não é inserido no código-fonte, no Gist nem nos backups.

O botão **Copiar backup** coloca um JSON **não criptografado** na área de transferência. Evite colá-lo em sites públicos ou chats. O botão **Restaurar** importa um JSON copiado mediante confirmação. **Remover token** apaga o token salvo neste navegador sem excluir registros locais.

## Privacidade

**Não envie ao repositório backups, tokens, senhas ou arquivos de dados pessoais.** O projeto contém exclusivamente **dados genéricos de exemplo**. O JSON com as informações pessoais iniciais foi entregue em arquivo separado, fora do ZIP público. Faça backups JSON em local seguro, independentemente do Gist.

## Arquivos

- `index.html`: aplicativo completo, CSS e JavaScript integrados;
- `manifest.webmanifest`: nome, tema e ícones de instalação;
- `service-worker.js`: cache offline e atualização da versão;
- `icons/`: ícones do aplicativo (192, 512, 180 e fonte SVG);
- `.nojekyll`: configuração de publicação estática no GitHub Pages;
- `.gitignore`: previne o envio acidental de backups, tokens e arquivos privados comuns.