/**
 * Romaneio - Contas a pagar
 *
 * Versão = CÓDIGO ORIGINAL (intacto) + uma etapa nova de UPLOAD por arrastar.
 *
 * A única diferença em relação ao original: em vez de colar o link do Excel
 * na célula Z1 na mão, você arrasta o arquivo num diálogo. O diálogo faz o
 * upload do Excel para o Drive e escreve o link dele na Z1. A partir daí o
 * fluxo é EXATAMENTE o original (fun1 -> executarTudo -> importarexcel lê Z1).
 *
 * Funções novas: enviarArquivoExcel(), salvarUploadEmZ1(arquivo)
 * Arquivo HTML novo: DialogoDrop
 * Tudo o mais é o código original.
 */

// ============================================================
// BACKUP / RESTAURAÇÃO DA "Base Excel"  (original)
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
// IMPORTAR EXCEL PELO LINK EM Z1  (original, inalterado)
// ============================================================

function importarexcel() {
  try {
    var destinoSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var abaDestino = destinoSpreadsheet.getSheetByName("Base Excel");
    if (!abaDestino) throw new Error("A aba 'Base Excel' não foi encontrada.");

    var link = abaDestino.getRange("Z1").getValue();
    if (!link) throw new Error("Nenhum link do Excel foi informado na célula Z1.");

    var fileId = extrairIdDoDrive(link);
    var file = DriveApp.getFileById(fileId);

    var blob = file.getBlob();

    var resource = {
      title: file.getName(),
      mimeType: MimeType.GOOGLE_SHEETS
    };

    var googleSheetFile = Drive.Files.create(resource, blob);

    Logger.log('Arquivo Excel convertido em arquivo Google Sheets: ' + googleSheetFile.id);

    Utilities.sleep(10000);

    var planilhaSheets = SpreadsheetApp.openById(googleSheetFile.id);
    var abaOrigem = planilhaSheets.getSheets()[0];

    // Ajusta as linhas acima do cabeçalho
    ajustarLinhasAcimaDoCabecalho(abaOrigem);

    var dados = abaOrigem.getDataRange().getValues();

    abaDestino.clearContents();
    abaDestino.getRange("Z1").setValue(link); // mantém o link salvo
    abaDestino.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

  } catch (erro) {
    Logger.log("Erro: " + erro.stack);
    SpreadsheetApp.getUi().alert("Erro: " + erro.message);
    throw erro;
  }
}

function extrairIdDoDrive(link) {
  var match = link.match(/[-\w]{25,}/);
  if (!match) {
    throw new Error("Não foi possível identificar o ID do arquivo no link informado.");
  }
  return match[0];
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

// ============================================================
// PDF  (original)
// ============================================================

var SS = SpreadsheetApp.getActiveSpreadsheet();
var Invoice_Sheet = SS.getSheetByName("PDF");

function montarPdfBlob() {
  var url_ext = 'export?exportFormat=pdf&format=pdf'
      + '&size=A4'
      + '&portrait=true'
      + '&fitw=true'
      + '&sheetnames=false&printtitle=false&pagenum=UNDEFINED'
      + '&gridlines=false'
      + '&fzr=false'
      + '&gid=' + Invoice_Sheet.getSheetId();

  var options = {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    }
  };

  var extra = Invoice_Sheet.getRange("B6").getValue();
  var pdfName = "Backup - Contas Previstas - " + extra;

  var response = UrlFetchApp.fetch("https://docs.google.com/spreadsheets/d/" + SS.getId() + "/" + url_ext, options);
  var blob = response.getBlob().setName(pdfName + '.pdf');

  return blob;
}

function getPdfPreviewData() {
  var blob = montarPdfBlob();

  return {
    base64: Utilities.base64Encode(blob.getBytes()),
    fileName: blob.getName()
  };
}

// ============================================================
// MENU  (única mudança: item de arrastar no lugar do link)
// ============================================================

var PASTA_COPIA_PLANILHA_ID = "1khC-g7QTS4Z2hOJOBdWHDeDA1_w0nlLK";

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF - Contas a pagar')
    .addItem('Enviar arquivo Excel (arrastar)', 'enviarArquivoExcel')
    .addItem('Gerar PDF - Contas a pagar', 'fun1')
    .addToUi();
}

// ============================================================
// NOVO: UPLOAD POR ARRASTAR -> grava o link na Z1
// ------------------------------------------------------------
// Abre o diálogo de arrastar. Ao soltar, o navegador manda os bytes do arquivo
// para salvarUploadEmZ1(), que salva o Excel no Drive e escreve o link na Z1.
// Depois disso é só usar "Gerar PDF - Contas a pagar" (fluxo original).
// ============================================================

function enviarArquivoExcel() {
  var html = HtmlService.createHtmlOutputFromFile('DialogoDrop')
    .setWidth(460)
    .setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, 'Enviar arquivo Excel');
}

function salvarUploadEmZ1(arquivo) {
  if (!arquivo || !arquivo.bytes) {
    throw new Error("Nenhum arquivo foi recebido.");
  }

  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Excel");
  if (!aba) throw new Error("A aba 'Base Excel' não foi encontrada.");

  var bytes = Utilities.base64Decode(arquivo.bytes);
  var mimeType = arquivo.mimeType ||
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  var nome = arquivo.nome || "Excel enviado.xlsx";
  var blob = Utilities.newBlob(bytes, mimeType, nome);

  // Salva o arquivo Excel no seu Drive
  var file = DriveApp.createFile(blob);

  // Escreve o link na Z1 — exatamente o que o fluxo original espera ler
  var url = file.getUrl();
  aba.getRange("Z1").setValue(url);

  Logger.log("Arquivo salvo no Drive: " + url);
  return url;
}

// ============================================================
// FLUXO PRINCIPAL  (original, inalterado)
// ============================================================

// Primeira confirmação
function fun1() {
  var ui = SpreadsheetApp.getUi();

  var resposta = ui.alert(
    'PDF - Contas a pagar',
    'Você acionou "Gerar PDF - Contas a pagar". Quer mesmo continuar com o processo?',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta == ui.Button.CANCEL) {
    return;
  }

  executarTudo();
}

function executarTudo() {
  try {
    criarBackupBaseExcel();
    prepararRomaneio();
    importarexcel();

    var preview = getPdfPreviewData();
    abrirDialogoFinal(preview.base64);

  } catch (erro) {
    SpreadsheetApp.getUi().alert("Erro: " + erro.message);
    Logger.log(erro.stack);
  }
}

function abrirDialogoFinal(pdfBase64) {
  var template = HtmlService.createTemplateFromFile('DialogoFinal');
  template.pdfBase64 = pdfBase64;

  var html = template.evaluate()
    .setWidth(500)
    .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(html, 'Finalizar operação');
}

function concluirOperacao() {
  try {
    var arquivoPdf = generatePdf();
    var arquivoPlanilha = salvarCopiaDaPlanilha();

    registrarChaveRomaneio(arquivoPlanilha, arquivoPdf);

    // AQUI roda o seu código de Append/Replace
    identificarPlanilhaEAba();

    removerBackupBaseExcel();
    limparEstadoRomaneioTemporario();

    return 'Operação concluída com sucesso.';

  } catch (erro) {
    Logger.log(erro.stack);
    throw new Error("Erro ao concluir: " + erro.message);
  }
}

function cancelarOperacao() {
  try {
    restaurarBackupBaseExcel();
    restaurarB6Romaneio();
    removerBackupBaseExcel();
    limparEstadoRomaneioTemporario();

    return 'Operação cancelada. Nada foi salvo.';

  } catch (erro) {
    Logger.log(erro.stack);
    throw new Error("Erro ao cancelar: " + erro.message);
  }
}

function salvarCopiaDaPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var arquivo = DriveApp.getFileById(ss.getId());
  var pasta = DriveApp.getFolderById(PASTA_COPIA_PLANILHA_ID);

  var abaPDF = ss.getSheetByName("PDF");
  var extra = abaPDF.getRange("B6").getValue();

  var nomeCopia = "Backup - Contas Previstas - " + extra;

  var copia = arquivo.makeCopy(nomeCopia, pasta);
  return copia;
}

// ============================================================
// ROMANEIO  (original)
// ============================================================

function prepararRomaneio() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaPDF = ss.getSheetByName("PDF");
  var abaRegistro = ss.getSheetByName("Chave Romaneio");

  if (!abaPDF) throw new Error('A aba "PDF" não foi encontrada.');
  if (!abaRegistro) throw new Error('A aba "Chave Romaneio" não foi encontrada.');

  var props = PropertiesService.getDocumentProperties();

  props.setProperty("romaneio_B6_anterior", abaPDF.getRange("B6").getValue());

  var proximaLinha = Math.max(2, abaRegistro.getLastRow() + 1);
  var numeroRomaneio = proximaLinha - 1;

  var chaveRomaneio = montarChaveRomaneio(numeroRomaneio);

  abaPDF.getRange("B6").setValue(chaveRomaneio);

  props.setProperty("romaneio_linha", String(proximaLinha));
  props.setProperty("romaneio_numero", String(numeroRomaneio));
  props.setProperty("romaneio_chave", chaveRomaneio);
}

function montarChaveRomaneio(numeroRomaneio) {
  var hoje = new Date();
  var ano = hoje.getFullYear();
  var mes = String(hoje.getMonth() + 1).padStart(2, "0");
  var numeroFormatado = String(numeroRomaneio).padStart(6, "0");

  return "ROM-" + ano + "." + mes + "." + numeroFormatado;
}

function registrarChaveRomaneio(arquivoPlanilha, arquivoPdf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaRegistro = ss.getSheetByName("Chave Romaneio");
  if (!abaRegistro) throw new Error('A aba "Chave Romaneio" não foi encontrada.');

  var props = PropertiesService.getDocumentProperties();

  var linha = parseInt(props.getProperty("romaneio_linha"), 10);
  var numero = parseInt(props.getProperty("romaneio_numero"), 10);
  var chave = props.getProperty("romaneio_chave");

  if (!linha || !numero || !chave) {
    throw new Error("Dados temporários do romaneio não encontrados.");
  }

  abaRegistro.getRange(linha, 2).setValue(arquivoPlanilha.getUrl());
  abaRegistro.getRange(linha, 3).setValue(arquivoPdf.getUrl());
  abaRegistro.getRange(linha, 4).setValue(chave);
  abaRegistro.getRange(linha, 5).setValue(numero);
}

function restaurarB6Romaneio() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaPDF = ss.getSheetByName("PDF");
  if (!abaPDF) return;

  var props = PropertiesService.getDocumentProperties();
  var valorAnterior = props.getProperty("romaneio_B6_anterior");

  if (valorAnterior === null) {
    abaPDF.getRange("B6").clearContent();
  } else {
    abaPDF.getRange("B6").setValue(valorAnterior);
  }
}

function limparEstadoRomaneioTemporario() {
  var props = PropertiesService.getDocumentProperties();
  props.deleteProperty("romaneio_linha");
  props.deleteProperty("romaneio_numero");
  props.deleteProperty("romaneio_chave");
  props.deleteProperty("romaneio_B6_anterior");
}

// ============================================================
// PDF salvo no Drive  (original)
// ============================================================

function generatePdf() {
  var folder = DriveApp.getFolderById("1vkInENNxcVrCvegdgkxNEaG6xW3934Mk");
  var blob = montarPdfBlob();
  var arquivoPdf = folder.createFile(blob);
  return arquivoPdf;
}

// ============================================================
// APPEND / REPLACE a partir da aba "Referência"  (original)
// ============================================================

function identificarPlanilhaEAba() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaReferencia = planilha.getSheetByName("Referência");

  if (!abaReferencia) {
    throw new Error('A aba "Referência" não foi encontrada.');
  }

  executarLoop(abaReferencia);
}

function executarLoop(abaReferencia) {
  var ultimaReferencia = abaReferencia.getLastRow();

  for (var linha = 3; linha <= ultimaReferencia; linha++) {
    try {
      Logger.log("For: " + linha);
      copiarecolarsemloop(abaReferencia, linha);
    } catch (erro) {
      Logger.log("Erro na linha " + linha + ": " + erro.message);
      abaReferencia.getRange("I" + linha).setValue(
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
      );
      abaReferencia.getRange("J" + linha).setValue("Erro");
      abaReferencia.getRange("K" + linha).setValue(erro.message);
    }
  }
}

function encontrarProximaLinhaVazia(sheet, linhaInicial, colunaInicial) {
  if (!sheet) {
    throw new Error("A planilha de destino não foi encontrada.");
  }

  var maxRows = sheet.getMaxRows();

  var valores = sheet.getRange(
    linhaInicial,
    colunaInicial,
    maxRows - linhaInicial + 1,
    1
  ).getValues();

  for (var i = 0; i < valores.length; i++) {
    if (valores[i][0] === "" || valores[i][0] === null) {
      return linhaInicial + i;
    }
  }

  return sheet.getLastRow() + 1;
}

function copiarecolarsemloop(abaReferencia, linha) {
  if (!abaReferencia) {
    throw new Error("A aba de referência não foi recebida pela função.");
  }

  var ativa = abaReferencia.getRange("A" + linha).getValue();

  if (ativa != "Sim") {
    Logger.log("Linha " + linha + " inativa");
    abaReferencia.getRange("I" + linha).setValue(
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
    );
    abaReferencia.getRange("J" + linha).setValue("Inativa");
    abaReferencia.getRange("K" + linha).setValue("");
    return;
  }

  var idOrigem = abaReferencia.getRange("B" + linha).getValue();
  var abaOrigem = abaReferencia.getRange("C" + linha).getValue();
  var intervaloOrigem = abaReferencia.getRange("D" + linha).getValue();
  var idDestino = abaReferencia.getRange("E" + linha).getValue();
  var abaDestino = abaReferencia.getRange("F" + linha).getValue();
  var intervaloDestino = abaReferencia.getRange("G" + linha).getValue();
  var appendReplace = abaReferencia.getRange("H" + linha).getValue();

  Logger.log("idOrigem: " + idOrigem);
  Logger.log("abaOrigem: " + abaOrigem);
  Logger.log("intervaloOrigem: " + intervaloOrigem);
  Logger.log("idDestino: " + idDestino);
  Logger.log("abaDestino: " + abaDestino);
  Logger.log("intervaloDestino: " + intervaloDestino);
  Logger.log("appendReplace: " + appendReplace);

  if (!idOrigem) throw new Error("ID da planilha de origem vazio.");
  if (!abaOrigem) throw new Error("Nome da aba de origem vazio.");
  if (!intervaloOrigem) throw new Error("Intervalo de origem vazio.");
  if (!idDestino) throw new Error("ID da planilha de destino vazio.");
  if (!abaDestino) throw new Error("Nome da aba de destino vazio.");
  if (!intervaloDestino) throw new Error("Intervalo de destino vazio.");

  var planilhaOrigem = SpreadsheetApp.openById(idOrigem);
  var sheetOrigem = planilhaOrigem.getSheetByName(abaOrigem);

  if (!sheetOrigem) {
    throw new Error('A aba de origem "' + abaOrigem + '" não foi encontrada.');
  }

  var planilhaDestino = SpreadsheetApp.openById(idDestino);
  var sheetDestino = planilhaDestino.getSheetByName(abaDestino);

  if (!sheetDestino) {
    throw new Error('A aba de destino "' + abaDestino + '" não foi encontrada.');
  }

  var lastRowOrigem = sheetOrigem.getLastRow();

  if (lastRowOrigem < 1) {
    throw new Error("A aba de origem não possui dados.");
  }

  var copiar = sheetOrigem.getRange(intervaloOrigem + lastRowOrigem);
  var dados = copiar.getValues();

  if (!dados || dados.length === 0 || dados[0].length === 0) {
    throw new Error("Nenhum dado encontrado para copiar.");
  }

  var colar;

  if (appendReplace == "Replace") {
    var primeiraCelulaDestino = intervaloDestino.split(":")[0];
    var linhaInicialDestino = sheetDestino.getRange(primeiraCelulaDestino).getRow();
    var colunaInicialDestino = sheetDestino.getRange(primeiraCelulaDestino).getColumn();

    var ultimaLinhaDestino = sheetDestino.getLastRow();
    var quantidadeLinhasDestino = ultimaLinhaDestino - linhaInicialDestino + 1;

    if (quantidadeLinhasDestino > 0) {
      sheetDestino.getRange(
        linhaInicialDestino,
        colunaInicialDestino,
        quantidadeLinhasDestino,
        dados[0].length
      ).clearContent();
    }

    colar = sheetDestino.getRange(
      linhaInicialDestino,
      colunaInicialDestino,
      dados.length,
      dados[0].length
    );

  } else if (appendReplace == "Append") {
    var primeiraCelulaDestinoAppend = intervaloDestino.split(":")[0];
    var linhaInicialDestinoAppend = sheetDestino.getRange(primeiraCelulaDestinoAppend).getRow();
    var colunaInicialDestinoAppend = sheetDestino.getRange(primeiraCelulaDestinoAppend).getColumn();

    var proximaLinhaDestino = encontrarProximaLinhaVazia(
      sheetDestino,
      linhaInicialDestinoAppend,
      colunaInicialDestinoAppend
    );

    colar = sheetDestino.getRange(
      proximaLinhaDestino,
      colunaInicialDestinoAppend,
      dados.length,
      dados[0].length
    );

  } else {
    throw new Error('A coluna H deve conter "Replace" ou "Append"');
  }

  colar.setValues(dados);

  abaReferencia.getRange("I" + linha).setValue(
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
  );
  abaReferencia.getRange("J" + linha).setValue("Sucesso");
  abaReferencia.getRange("K" + linha).setValue("");
}
