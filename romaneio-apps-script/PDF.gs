/**
 * PDF.gs
 * Geração do PDF a partir da aba "PDF".
 * (Sem alterações em relação à versão com link — mantido igual.)
 */

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

function generatePdf() {
  var folder = DriveApp.getFolderById("1vkInENNxcVrCvegdgkxNEaG6xW3934Mk");
  var blob = montarPdfBlob();
  var arquivoPdf = folder.createFile(blob);
  return arquivoPdf;
}
