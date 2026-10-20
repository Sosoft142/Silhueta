# Silhueta 2.9 — auditoria visual mobile e entradas de dados

Data: 20/10/2026. Resultado: foram confirmados sete grupos de problemas. A navegação e o registro básico funcionam, mas a proteção de rascunhos e as importações precisam de correção.

A auditoria não modificou o código do aplicativo na branch main. A rotina de teste, este relatório e o workflow ficam na branch qa/mobile-input-audit-20261020.

## Evidências e método

- Código auditado: [85d69c29fa58dd439fcab644b64b285b42b78af2](https://github.com/Sosoft142/Silhueta/tree/85d69c29fa58dd439fcab644b64b285b42b78af2).
- O HTML de https://sosoft142.github.io/Silhueta/ respondeu HTTP 200 e foi comparado byte a byte com o HTML do repositório: idênticos.
- SHA-256 do HTML publicado: f911e3ee8bcf593d3bfca27f89028ee92fc7a9e4c851f4ee8d5e9177a56e93f3.
- Navegador: Chromium 141.0.7390.37, Playwright 1.56.1, contexto pt-BR, fuso America/Sao_Paulo.
- Larguras: 320, 360, 390, 414, 768, 1024 e 1440 pixels; altura 844 pixels. Emulação mobile/toque até 850 pixels.
- Seis páginas em cada largura: Início, Medidas, Evolução, Nutrição, Configurações e Como usar.
- Estado e armazenamento locais isolados, com dados fictícios. Nenhum token pessoal ou Gist autenticado foi utilizado.
- [Execução final, logs, relatório JSON e capturas](https://github.com/Sosoft142/Silhueta/actions/runs/39488384764).
- Artefato: silhueta-mobile-input-audit, com dez capturas JPEG e report.json, retido até 03/11/2026.
- Resultado: 28 cenários, 15 aprovados e 13 com falha. As 13 falhas correspondem aos sete grupos descritos abaixo; seis casos têm a mesma causa de perda de rascunhos, e a legibilidade dos gráficos foi medida em duas larguras.
- A execução aparece como failure porque os testes reproduziram defeitos do app; a instalação do navegador e o armazenamento das evidências foram concluídos.

## Problemas confirmados

| Prioridade | Problema | Evidência |
| --- | --- | --- |
| Alta | Campos não salvos desaparecem sem confirmação em ações específicas | Seis caminhos reproduzidos no navegador: filtro de histórico, troca de semana, edição de outro registro, troca de gráfico e salvamento de um formulário que apaga o outro na mesma tela. |
| Alta | JSON malformado pode impedir a abertura do aplicativo | Uma medição com date numérico 123 foi persistida; a importação mostrou erro, mas, após recarregar, o conteúdo principal ficou vazio e houve TypeError. |
| Média | CSV de registros migrados duplica o histórico | Um registro com ID legacy_0_weight passou de uma ocorrência para três após duas importações do mesmo CSV. |
| Média | Importação nutricional não aplica os limites dos formulários | Foram salvos -500 kcal/dia, 99 treinos e 50 horas de sono por noite. |
| Média | Anotações longas sem espaços quebram a largura mobile | Uma nota válida de 500 caracteres expandiu o documento para 3379 pixels em uma tela configurada para 320 pixels. |
| Média | Eixos dos gráficos ficam ilegíveis no celular | O tamanho efetivo da fonte SVG foi 4,02 pixels em 320 pixels e 5,16 pixels em 390 pixels, confirmado também pelas capturas. |
| Baixa | Limites HTML do registro em lote divergem dos limites de salvamento | O navegador considera 15 kg e 150% válidos nos campos de lote; o JavaScript recusa esses valores ao salvar. Não foram gravados nesses testes. |

### 1. Perda de rascunhos

Foram reproduzidos os seguintes casos:

1. Medidas: digitar 75,5 sem salvar e mudar o filtro do histórico para Peso. O valor é apagado, sem confirmação.
2. Nutrição: digitar 1850 kcal sem salvar e avançar uma semana. O campo é apagado, sem confirmação.
3. Nutrição: deixar um consumo digitado e salvar as metas de macronutrientes. O consumo desaparece.
4. Nutrição: deixar uma meta de proteína digitada e salvar o consumo. A meta ainda não salva desaparece.
5. Medidas: começar um novo registro e tocar em Editar em outro registro do histórico. O formulário atual é substituído sem confirmação.
6. Evolução: preencher uma meta corporal e mudar a região no seletor de gráfico. A meta desaparece.

A confirmação existe ao mudar de página pela navegação principal e ao trocar entre registro rápido e lote. Esses caminhos passaram; a proteção precisa cobrir as demais ações que redesenham a página.

Referências: [eventos e renderização](https://github.com/Sosoft142/Silhueta/blob/85d69c29fa58dd439fcab644b64b285b42b78af2/index.html#L985), [salvamento de formulários](https://github.com/Sosoft142/Silhueta/blob/85d69c29fa58dd439fcab644b64b285b42b78af2/index.html#L923).

### 2. Importação JSON e falha persistente

A importação valida apenas parte da estrutura do backup. Um objeto de medição com data de tipo incorreto pode chegar a persist() antes de render() falhar. O alerta de importação malsucedida não desfaz a substituição do estado.

Reprodução com dados fictícios: importar um backup com profile, macros, measurements e metricEntries, contendo uma entrada de Peso com value 75 e date 123. O navegador registrou: "iso.split is not a function or its return value is not iterable". Após recarregar, o conteúdo de #main tinha zero caracteres.

Correção indicada: validar integralmente uma cópia temporária, incluindo tipos, datas, regiões e faixas numéricas, antes de substituir ou persistir o estado válido.

Referência: [importFile](https://github.com/Sosoft142/Silhueta/blob/85d69c29fa58dd439fcab644b64b285b42b78af2/index.html#L974).

### 3. Duplicação e validação de CSV

O importador de medições reconhece como reaproveitáveis IDs iniciados por m_, mas os registros migrados usam legacy_. Ao reimportar o CSV de um registro migrado, um novo ID é criado e a mesma medição aparece novamente.

No CSV nutricional, os números são convertidos sem a aplicação das faixas utilizadas no formulário. Por isso, valores impossíveis ou fora dos limites são aceitos.

Correções indicadas: preservar os identificadores legítimos de registros migrados e aplicar o mesmo validador de dados a formulários, CSV e JSON.

Referência: [importCSV](https://github.com/Sosoft142/Silhueta/blob/85d69c29fa58dd439fcab644b64b285b42b78af2/index.html#L941).

### 4. Interface mobile

Com dados normais, as 42 combinações de página e largura não apresentaram rolagem horizontal. O menu lateral abriu e fechou, inclusive pela tecla Escape. As quatro abas inferiores apareceram nas capturas mobile. As 12 imagens anatômicas foram decodificadas e a troca de região preservou o valor ainda não salvo.

Os problemas visuais concretos foram:

- Os textos dos eixos dos gráficos diminuem junto com um SVG de largura de referência 740. Na tela de 320 pixels, a fonte efetiva ficou em 4,02 pixels; na de 390, em 5,16 pixels. O limiar de 10 pixels no teste é um critério diagnóstico de legibilidade, sem alegação de auditoria normativa de acessibilidade.
- Um texto contínuo de 500 caracteres em uma anotação não quebra linha adequadamente. A largura do documento passou a 3379 pixels, com clientWidth 320 e innerWidth 1280. Essa condição também prejudicou as interações de toque automatizadas.
- Na captura de Nutrição em 390 pixels, o final da data no seletor de semana aparece truncado. É uma observação visual adicional, sem teste específico de reprovação nesta rotina.

Correções indicadas: redesenhar os gráficos conforme a largura disponível, manter eixos legíveis e reduzir a quantidade de rótulos quando necessário; permitir quebra de palavras/URLs nas anotações; ajustar a apresentação do seletor de semana.

## Fluxos aprovados

- Registro rápido com entradas independentes da mesma região no mesmo dia.
- Edição de uma medição sem alterar a outra.
- Exclusão individual com marcador de exclusão e persistência após recarregar.
- Restrição nativa de peso abaixo do mínimo no registro rápido.
- Rejeição de data impossível antes de salvar.
- Validação de todo o lote antes da gravação, sem salvamento parcial.
- Alternância das 12 regiões anatômicas, carregamento das imagens e preservação do campo não salvo.
- Confirmação de saída na navegação principal, preservando o rascunho quando a saída é recusada.
- Renderização e navegação das seis páginas nas sete larguras, com registros normais.
- Em testes isolados adicionais de JavaScript: migração sem duplicação, preservação da referência de 75 kg sem gerar uma pesagem fictícia e mesclagem simulada de marcador de exclusão.

## Limites da verificação

A emulação de navegador não substitui um aparelho Android físico. Não foram testados o teclado virtual real, a instalação/atualização do PWA em um aparelho físico, nem a sincronização autenticada com o Gist pessoal e a troca real entre dois dispositivos.

Houve também inspeção direta do site pelo TinyFish, em sessão isolada, mas o serviço não permitiu redimensionar a janela. Portanto, suas estimativas sobre mobile não foram utilizadas como evidência de layout. As conclusões de mobile deste relatório vêm das capturas e medições do Chromium.

## Ordem indicada para correção

1. Tornar a importação JSON validada e transacional e impedir a perda de rascunhos em todas as ações.
2. Corrigir identidade de registros migrados e faixas numéricas nas importações e no lote.
3. Corrigir quebra de anotações, tamanho dos eixos dos gráficos e seletor de semana.
4. Executar novamente a mesma rotina e verificar Android físico e sincronização autenticada em uma etapa específica.
