# Silhueta

- A versão pública do aplicativo tem como fonte `APP_VERSION` em `index.html`. O `VERSION=7` é a versão dos dados salvos e não deve ser alterado para uma atualização visual.
- Em cada atualização do aplicativo, execute `node scripts/release.mjs patch` (ou informe uma versão X.Y.Z maior). O comando atualiza a versão pública, o cache do service worker, a referência do manifest e o README juntos.
- O rodapé de Configurações deve sempre mostrar `APP_VERSION`, sem manter outra cópia do número. Execute `node scripts/release.mjs --check` antes de publicar.
- A logo interna usa `icons/brand-mark.svg`, com fundo transparente e os mesmos traços da silhueta aprovada. Os ícones de instalação, o favicon e os arquivos referenciados pelo manifest são separados: só os altere mediante solicitação explícita.
- Preserve os registros existentes, a compatibilidade dos backups e as 12 ilustrações anatômicas aprovadas.
