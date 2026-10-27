# Silhueta

- A versão pública do aplicativo tem como fonte `APP_VERSION` em `index.html`. O `VERSION=7` é a versão dos dados salvos e não deve ser alterado para uma atualização visual.
- Em cada atualização do aplicativo, execute `node scripts/release.mjs patch` (ou informe uma versão X.Y.Z maior). O comando atualiza a versão pública, o cache do service worker e o README juntos.
- A URL do manifest deve permanecer `./manifest.webmanifest`, sem query de versão. O `id` deve permanecer `/Silhueta/index.html`, preservando a identidade calculada para as instalações antigas. Não renomeie o manifest nem altere `id`, `start_url` ou `scope` para contornar um erro de instalação.
- O manifest usa atualização pela rede com fallback offline. A limpeza de caches do service worker deve se limitar ao prefixo do Silhueta e preservar dados locais e caches de outros projetos.
- O rodapé de Configurações deve sempre mostrar `APP_VERSION`, sem manter outra cópia do número. Execute `node scripts/release.mjs --check` antes de publicar.
- A logo interna usa `icons/brand-mark.svg`, com fundo transparente e os mesmos traços da silhueta aprovada. Os ícones de instalação, o favicon e os arquivos referenciados pelo manifest são separados: só os altere mediante solicitação explícita.
- Preserve os registros existentes, a compatibilidade dos backups e as 12 ilustrações anatômicas aprovadas.
- `silhueta.ui.quickMetric` guarda apenas a última região, por aparelho. `silhueta.ui.lastSyncConfirmation` só pode ser atualizado depois da verificação bem-sucedida do Gist; não use datas importadas/sincronizadas para afirmar que este aparelho confirmou a nuvem.
- Desfazer uma exclusão conserva o ID e os dados da medição, com relógio de sincronização posterior ao marcador excluído. Recuse a restauração se o registro tiver sido alterado novamente; não substitua uma versão mais recente.
- A referência no registro rápido usa a última medição real pela data, excluindo registros removidos, e não preenche o novo valor. A confirmação detalhada só pode afirmar salvamento local quando `storageOK` for verdadeiro.
- `preferences.measurementWeekday` aceita somente null ou um inteiro de 0 (domingo) a 6 (sábado). A contagem semanal segue o calendário local do aparelho, com zero no próprio dia; salvar uma região não conclui o dia inteiro. A atualização do contador não deve redesenhar nem apagar formulários em edição.
- O cache HTML tem uma única entrada canônica em `index.html`; a raiz e as consultas ao documento devem funcionar offline usando essa mesma cópia. Reutilize os formatadores por precisão e a lista já consultada em cada cartão do painel.
