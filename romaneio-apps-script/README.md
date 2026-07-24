# Romaneio - Contas a pagar (versão com upload de arquivo)

Código do Google Apps Script para gerar romaneios/PDFs de "Contas a pagar".

Esta versão substitui o fluxo antigo — em que era preciso **colar o link** do
Excel na célula `Z1` — por um fluxo de **upload (arrastar e soltar)** do arquivo.

Os arquivos aqui espelham a estrutura do projeto no editor do Apps Script, para
você substituir **arquivo por arquivo** (não cole tudo em um `.gs` só, senão as
funções ficam duplicadas e o projeto quebra).

## Arquivos

| Neste repositório | No editor do Apps Script | Papel |
|---|---|---|
| `Código.gs` | `Código.gs` | Menu, backup da "Base Excel" e importação por upload. |
| `PDF.gs` | `PDF.gs` | Geração do PDF a partir da aba "PDF". |
| `Exec_Tudo.gs` | `Exec_Tudo.gs` | Orquestração do processo e romaneio. |
| `Append_Replace.gs` | `Append/ Replace.gs` | Copiar/colar entre planilhas (aba "Referência"). |
| `DialogoUpload.html` | `DialogoUpload` (**novo**) | Diálogo de arrastar e soltar o Excel. |
| `DialogoFinal.html` | `DialogoFinal` | Diálogo final (Visualizar/Concluir/Cancelar). |

> Obs.: o arquivo `Append/ Replace.gs` tem uma barra no nome dentro do Apps
> Script; no repositório ele vira `Append_Replace.gs` porque a barra não é
> permitida em nome de arquivo. O conteúdo é o mesmo.

## O que mudou (e onde)

| Arquivo | Mudança |
|---|---|
| `Código.gs` | `onOpen()` sem o item "Inserir link do Excel"; `importarexcel()` virou `importarExcelDoUpload(arquivo)`; removidas `inserirLinkExcel()`, `extrairIdDoDrive()` e a leitura de `Z1`. |
| `Exec_Tudo.gs` | `fun1()` abre o `DialogoUpload`; `executarTudo()` virou `processarComArquivo(arquivo)`; corrigido o nome da propriedade em `restaurarB6Romaneio` (`romaneio_B6_anterior`). |
| `DialogoUpload.html` | Arquivo novo. |
| `PDF.gs`, `Append_Replace.gs`, `DialogoFinal.html` | Sem alterações. |

## Fluxo resumido

```
Menu "Gerar PDF - Contas a pagar"
  └─ fun1()  (confirma e abre o diálogo de upload)
       └─ DialogoUpload.html  (arrastar/soltar o Excel)
            └─ processarComArquivo(arquivo)
                 ├─ criarBackupBaseExcel()
                 ├─ prepararRomaneio()
                 ├─ importarExcelDoUpload(arquivo)
                 └─ getPdfPreviewData()
            └─ abrirDialogoFinal(preview.base64)
                 └─ DialogoFinal.html  (Visualizar / Concluir / Cancelar)
```

## Como instalar no projeto Apps Script

1. Abra a planilha → **Extensões → Apps Script**.
2. Substitua o conteúdo de `Código.gs` e `Exec_Tudo.gs` pelos daqui.
   (Não precisa mexer em `PDF.gs`, `Append/ Replace.gs` e `DialogoFinal`.)
3. Crie um arquivo HTML novo (**+ → HTML**) chamado exatamente `DialogoUpload`
   e cole o conteúdo de `DialogoUpload.html`.
4. Confirme que o serviço avançado **Drive API** está ativado
   (Serviços → Drive API), pois `Drive.Files.create` é usado na conversão.
5. Recarregue a planilha para o menu `PDF - Contas a pagar` aparecer.

## Observações

- O arquivo Google Sheets temporário criado na conversão é enviado para a
  lixeira automaticamente ao final da importação (`finally`).
- O limite prático de tamanho para upload via `google.script.run` gira em torno
  de ~50 MB; arquivos de contas a pagar normais ficam muito abaixo disso.
