# Silhueta — acompanhamento corporal (PWA)

Aplicativo estático de acompanhamento por 53 semanas, preparado para GitHub Pages e instalação no Chrome para Android. Mantém os dados locais no navegador e oferece backup criptografado por GitHub Gist com token clássico (permissão `gist`).

## Instalação

Acesse https://sosoft142.github.io/Silhueta/ no Chrome Android e use **Instalar aplicativo** ou **Adicionar à tela inicial**. O aplicativo dispõe de `manifest.webmanifest`, `service-worker.js` e ícones; a atualização do service worker pode levar algum tempo. Os ícones PNG são produzidos automaticamente pelo GitHub Actions a partir do SVG em `icons/icon.svg`.

## Sincronização e segurança

Abra o ícone de nuvem no topo. Insira um token clássico do GitHub com escopo exclusivo `gist`; se quiser armazená-lo neste dispositivo, marque a opção de lembrar. Um Gist secreto não é privado — por isso o backup é criptografado com AES-GCM. **Não coloque token, senhas ou dados pessoais no repositório.**

A sincronização é **manual**, não contínua. A versão 1.4 protege especialmente o primeiro acesso em outro dispositivo: se encontrar registros no Gist e apenas dados de demonstração no aparelho, oferece o recebimento antes de qualquer substituição. Em caso de conflito ou dúvida, exporte backups JSON dos dispositivos antes de escolher Enviar ou Receber.

A cor da nuvem indica o estado **deste dispositivo**: neutra quando não há confirmação, lilás quando existem alterações locais, vermelha em erro e verde após comunicação e verificação do backup no Gist. **Verde não garante que todos os outros dispositivos já receberam aquela versão; cada um precisa sincronizar.**

## Arquivos
- `index.html`: interface, cálculos e sincronização.
- `manifest.webmanifest`: metadados de instalação.
- `service-worker.js`: cache para uso offline.
- `icons/`: ícone SVG e PNGs gerados.
- `.github/workflows/icons.yml`: gera os PNGs necessários à instalação.
- `.nojekyll`: publicação estática.

Dados pessoais e credenciais não estão incluídos no repositório.
