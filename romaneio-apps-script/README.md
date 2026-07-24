# Romaneio - Contas a pagar (versão com upload de arquivo)

Código do Google Apps Script para gerar romaneios/PDFs de "Contas a pagar".

Esta versão substitui o fluxo antigo — em que era preciso **colar o link** do
Excel na célula `Z1` — por um fluxo de **upload (arrastar e soltar)** do arquivo.

## Arquivos

| Arquivo | Papel |
|---|---|
| `Codigo.gs` | Toda a lógica do servidor (backup, importação, PDF, romaneio, cópia/colagem). |
| `DialogoUpload.html` | Diálogo com área de arrastar e soltar para enviar o Excel. |
| `DialogoFinal.html` | Diálogo final: Visualizar / Concluir / Cancelar. |

## O que mudou em relação à versão com link

- **Removido** o item de menu "Inserir link do Excel" e a função `inserirLinkExcel()`.
- **Removida** a leitura da célula `Z1` e a função `extrairIdDoDrive()`.
- A antiga `importarexcel()` (que buscava o arquivo por ID no Drive) foi
  substituída por **`importarExcelDoUpload(arquivo)`**, que recebe os bytes do
  arquivo enviado pelo navegador (base64), monta o blob, converte em Google
  Sheets, ajusta o cabeçalho e cola os dados na aba "Base Excel".
- O menu "Gerar PDF - Contas a pagar" agora abre o `DialogoUpload.html`.
  Depois que o usuário solta o arquivo, o cliente chama
  `processarComArquivo(arquivo)`, que executa:
  `criarBackupBaseExcel()` → `prepararRomaneio()` → `importarExcelDoUpload()` →
  `getPdfPreviewData()`, e então abre o `DialogoFinal.html`.

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
2. Substitua o conteúdo do arquivo de código pelo de `Codigo.gs`.
3. Crie dois arquivos HTML (**+ → HTML**) com exatamente estes nomes:
   - `DialogoUpload`
   - `DialogoFinal`
   e cole o conteúdo dos respectivos arquivos.
4. Confirme que o serviço avançado **Drive API** está ativado
   (Serviços → Drive API), pois `Drive.Files.create` é usado na conversão.
5. Recarregue a planilha para o menu `PDF - Contas a pagar` aparecer.

## Observações

- O arquivo Google Sheets temporário criado na conversão é enviado para a
  lixeira automaticamente ao final da importação (`finally`).
- O limite prático de tamanho para upload via `google.script.run` gira em torno
  de ~50 MB; arquivos de contas a pagar normais ficam muito abaixo disso.
