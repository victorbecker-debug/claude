/**
 * Exec_Tudo.gs
 * Orquestração do processo e romaneio.
 *
 * MUDANÇAS em relação à versão com link:
 *   - fun1()              : agora abre o diálogo de upload (DialogoUpload) em vez de
 *                           executar tudo direto.
 *   - executarTudo()      : substituída por processarComArquivo(arquivo), chamada pelo
 *                           diálogo de upload depois que o arquivo é solto.
 *   - restaurarB6Romaneio : corrigido o nome da propriedade (romaneio_B6_anterior).
 */

var PASTA_COPIA_PLANILHA_ID = "1khC-g7QTS4Z2hOJOBdWHDeDA1_w0nlLK";

// Primeira confirmação -> abre o diálogo de upload
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

  var html = HtmlService.createHtmlOutputFromFile('DialogoUpload')
    .setWidth(460)
    .setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(html, 'Enviar arquivo Excel');
}

/**
 * Chamada pelo DialogoUpload.html depois que o usuário clica em "Processar arquivo".
 * Faz backup, prepara o romaneio, importa o Excel enviado e DEVOLVE o preview do PDF.
 *
 * IMPORTANTE: não abre um segundo diálogo. O Apps Script não abre um modal por cima
 * de outro modal de forma confiável quando a chamada parte de dentro de um diálogo.
 * Por isso a própria janela do DialogoUpload troca de tela e mostra as opções finais
 * (Visualizar / Concluir / Cancelar) usando este preview.
 */
function processarComArquivo(arquivo) {
  criarBackupBaseExcel();
  prepararRomaneio();
  importarExcelDoUpload(arquivo);

  return getPdfPreviewData();
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
// ROMANEIO
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
