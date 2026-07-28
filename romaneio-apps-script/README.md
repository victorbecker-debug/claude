# Romaneio - Contas a pagar (upload por arrastar → Z1)

Código do Google Apps Script para gerar romaneios/PDFs de "Contas a pagar".

Esta versão é o **código original, intacto**, com **uma única adição**: em vez de
colar o link do Excel na célula `Z1` na mão, você arrasta o arquivo num diálogo.
O diálogo faz o upload do Excel para o seu Drive e escreve o link dele na `Z1`.
A partir daí o fluxo é **exatamente o original** (`fun1 → executarTudo →
importarexcel` lê a `Z1`).

## Arquivos

| Arquivo | Papel |
|---|---|
| `Codigo.gs` | Todo o código (original + as duas funções novas do upload). |
| `DialogoDrop.html` | **Novo** — diálogo de arrastar o Excel (salva no Drive e grava a Z1). |
| `DialogoFinal.html` | Diálogo final do fluxo original (Visualizar/Concluir/Cancelar). |

## O que foi adicionado ao código original

- `onOpen()`: o menu ganhou o item **"Enviar arquivo Excel (arrastar)"**
  (no lugar do antigo "Inserir link do Excel").
- `enviarArquivoExcel()`: abre o diálogo `DialogoDrop`.
- `salvarUploadEmZ1(arquivo)`: recebe os bytes do arquivo, salva o Excel no
  Drive com `DriveApp.createFile` e escreve `file.getUrl()` na célula `Z1`.

Nada mais foi alterado: `importarexcel()`, `executarTudo()`, o romaneio, o PDF e
o Append/Replace continuam exatamente como no original.

## Como usar

1. Menu **PDF - Contas a pagar → Enviar arquivo Excel (arrastar)**.
2. Arraste (ou selecione) o `.xlsx` → clique em **Enviar arquivo**.
   O link é gravado na `Z1` e o diálogo fecha.
3. Menu **PDF - Contas a pagar → Gerar PDF - Contas a pagar** → segue o fluxo
   original (backup → romaneio → importa da `Z1` → diálogo final).

## Como instalar

1. **Extensões → Apps Script**.
2. Apague os arquivos de código antigos e crie um arquivo `Codigo.gs` com o
   conteúdo daqui (assim não sobra função duplicada).
3. Crie os arquivos HTML (**+ → HTML**) com os nomes exatos `DialogoDrop` e
   `DialogoFinal`.
4. Confirme que o serviço avançado **Drive API** está ativado
   (Serviços → Drive API) — usado por `importarexcel` na conversão.
5. Recarregue a planilha.

## Observação

Cada envio cria um novo arquivo Excel no seu Drive (raiz). Se quiser guardá-los
numa pasta específica, dá para trocar `DriveApp.createFile(blob)` por
`DriveApp.getFolderById("ID_DA_PASTA").createFile(blob)` em `salvarUploadEmZ1`.
