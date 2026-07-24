/**
 * Append_Replace.gs
 * (No Apps Script o arquivo se chama "Append/ Replace".)
 *
 * Copia/cola dados entre planilhas conforme a configuração da aba "Referência".
 * Sem alterações em relação à versão com link — mantido igual.
 */

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
