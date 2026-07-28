/**
 * Código.gs
 * Menu, backup da "Base Excel" e importação do Excel via UPLOAD (arrastar e soltar).
 *
 * MUDANÇAS em relação à versão com link:
 *   - onOpen()          : menu sem o item "Inserir link do Excel".
 *   - importarexcel()   : substituída por importarExcelDoUpload(arquivo).
 *   - Removidas         : inserirLinkExcel(), extrairIdDoDrive() e a leitura da célula Z1.
 */

// ============================================================
// MENU
// ============================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF - Contas a pagar')
    .addItem('Gerar PDF - Contas a pagar', 'fun1')
    .addToUi();
}

// ============================================================
// BACKUP / RESTAURAÇÃO DA "Base Excel"
// ============================================================

function criarBackupBaseExcel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaBase = ss.getSheetByName("Base Excel");
  if (!abaBase) throw new Error("A aba 'Base Excel' não foi encontrada.");

  var abaBackup = ss.getSheetByName("_BACKUP_BASE_EXCEL");
  if (abaBackup) {
    ss.deleteSheet(abaBackup);
  }

  abaBackup = ss.insertSheet("_BACKUP_BASE_EXCEL");
  var dados = abaBase.getDataRange().getValues();

  if (dados.length > 0 && dados[0].length > 0) {
    abaBackup.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
  }

  abaBackup.hideSheet();
}

function restaurarBackupBaseExcel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaBase = ss.getSheetByName("Base Excel");
  var abaBackup = ss.getSheetByName("_BACKUP_BASE_EXCEL");

  if (!abaBase || !abaBackup) return;

  abaBase.clearContents();

  var dados = abaBackup.getDataRange().getValues();
  if (dados.length > 0 && dados[0].length > 0) {
    abaBase.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
  }
}

function removerBackupBaseExcel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaBackup = ss.getSheetByName("_BACKUP_BASE_EXCEL");
  if (abaBackup) {
    ss.deleteSheet(abaBackup);
  }
}

// ============================================================
// IMPORTAÇÃO DO EXCEL VIA UPLOAD (arrastar e soltar)
// ------------------------------------------------------------
// Recebe o arquivo enviado pelo diálogo DialogoUpload.html.
// "arquivo" é um objeto: { nome, mimeType, bytes(base64) }.
// Substitui a antiga importarexcel() que lia o link da célula Z1.
// ============================================================

function importarExcelDoUpload(arquivo) {
  var googleSheetFile = null;

  try {
    var destinoSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var abaDestino = destinoSpreadsheet.getSheetByName("Base Excel");
    if (!abaDestino) throw new Error("A aba 'Base Excel' não foi encontrada.");

    if (!arquivo || !arquivo.bytes) {
      throw new Error("Nenhum arquivo foi recebido para importação (bytes vazios).");
    }

    Logger.log("importarExcelDoUpload: nome=" + arquivo.nome +
               " mime=" + arquivo.mimeType +
               " tamanhoBase64=" + arquivo.bytes.length);

    // Monta o blob a partir dos bytes enviados (base64) pelo navegador
    var bytes = Utilities.base64Decode(arquivo.bytes);
    var mimeType = arquivo.mimeType ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    var nome = arquivo.nome || "Excel importado";
    var blob = Utilities.newBlob(bytes, mimeType, nome);

    // Converte o Excel em um arquivo Google Sheets temporário.
    // "name" (Drive API v3) e "title" (v2) juntos, para funcionar nas duas versões.
    var resource = {
      name: nome,
      title: nome,
      mimeType: MimeType.GOOGLE_SHEETS
    };

    googleSheetFile = Drive.Files.create(resource, blob);
    Logger.log('Convertido para Google Sheets: ' + googleSheetFile.id);

    // Espera a conversão FICAR PRONTA de verdade (em vez de um sleep fixo de 10s).
    // Reabre a planilha até ela ter dados, com no máximo ~30s de espera.
    var planilhaSheets = SpreadsheetApp.openById(googleSheetFile.id);
    var abaOrigem = planilhaSheets.getSheets()[0];
    var tentativas = 0;
    while (abaOrigem.getLastRow() === 0 && tentativas < 15) {
      Utilities.sleep(2000);
      planilhaSheets = SpreadsheetApp.openById(googleSheetFile.id);
      abaOrigem = planilhaSheets.getSheets()[0];
      tentativas++;
    }

    Logger.log("Origem convertida: linhas=" + abaOrigem.getLastRow() +
               " colunas=" + abaOrigem.getLastColumn() +
               " (esperas=" + tentativas + ")");

    if (abaOrigem.getLastRow() === 0) {
      throw new Error("A conversão do Excel não trouxe dados (planilha vazia). " +
        "Confirme que o arquivo enviado é um Excel válido e com conteúdo.");
    }

    // Ajusta as linhas acima do cabeçalho
    ajustarLinhasAcimaDoCabecalho(abaOrigem);

    var dados = abaOrigem.getDataRange().getValues();
    Logger.log("Vou colar na Base Excel: linhas=" + dados.length +
               " colunas=" + (dados[0] ? dados[0].length : 0));

    abaDestino.clearContents();
    abaDestino.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    Logger.log("Base Excel atualizada com os dados do arquivo enviado.");

  } catch (erro) {
    Logger.log("ERRO importarExcelDoUpload: " + erro.stack);
    throw erro;

  } finally {
    // Remove o arquivo temporário convertido, se foi criado
    if (googleSheetFile && googleSheetFile.id) {
      try {
        DriveApp.getFileById(googleSheetFile.id).setTrashed(true);
      } catch (e) {
        Logger.log("Não foi possível remover o arquivo temporário: " + e.message);
      }
    }
  }
}

function ajustarLinhasAcimaDoCabecalho(abaOrigem) {
  var linhaCabecalho = encontrarLinhaCabecalho(abaOrigem);

  if (!linhaCabecalho) {
    throw new Error("Não foi possível localizar a linha do cabeçalho no Excel importado.");
  }

  // Exclui tudo acima do cabeçalho
  if (linhaCabecalho > 1) {
    abaOrigem.deleteRows(1, linhaCabecalho - 1);
  }

  // Deixa apenas 1 linha em branco acima do cabeçalho
  abaOrigem.insertRowsBefore(1, 1);
}

function encontrarLinhaCabecalho(abaOrigem) {
  var ultimaLinha = abaOrigem.getLastRow();
  var ultimaColuna = abaOrigem.getLastColumn();

  if (ultimaLinha === 0 || ultimaColuna === 0) {
    return null;
  }

  var dados = abaOrigem.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();

  var cabecalhosEsperados = [
    "Tipo",
    "Origem",
    "Data de Previsão (completa)",
    "Cliente ou Fornecedor (Razão Social)",
    "Valor Líquido"
  ];

  for (var i = 0; i < dados.length; i++) {
    var linha = dados[i].map(function(valor) {
      return String(valor).trim().toLowerCase();
    });

    var encontrados = cabecalhosEsperados.filter(function(cabecalho) {
      return linha.indexOf(String(cabecalho).trim().toLowerCase()) !== -1;
    });

    // Se encontrar pelo menos 4 desses 5 cabeçalhos, considera essa a linha do cabeçalho
    if (encontrados.length >= 4) {
      return i + 1;
    }
  }

  return null;
}
