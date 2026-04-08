const { XMLParser } = require('fast-xml-parser');

/**
 * Turkcell UBL-XML faturasını ayrıştırır.
 * @param {Buffer} xmlBuffer 
 * @returns {Promise<Array>} Ayrıştırılmış fatura kayıtları
 */
async function parseInvoiceXML(xmlBuffer) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  
  const xmlObj = parser.parse(xmlBuffer.toString('utf-8'));
  const invoice = xmlObj.Invoice || xmlObj['@_Invoice'] || xmlObj;
  
  // Notlar alanını bul (Turkcell verileri Note içinde saklıyor)
  let notes = invoice['cbc:Note'] || [];
  if (!Array.isArray(notes)) notes = [notes];

  const extractedRecords = [];

  // F2- ile başlayan fatura satırlarını işle
  // Format: F2-GSM?TARİFE#FATURA_TUTARI$ÖDENECEK_TUTAR+KDV!ÖİV
  // Örn: F2-5316815970?Paketcell#567.6$567.6+83.18!41.59
  for (const note of notes) {
    const text = typeof note === 'object' ? note['#text'] || '' : note;
    
    if (text.startsWith('F2-')) {
      const parts = text.substring(3).split(/[?#$+!]/);
      // parts[0]: GSM
      // parts[1]: TARİFE
      // parts[2]: FATURA TUTARI
      // parts[3]: ÖDENECEK TUTAR
      // parts[4]: KDV
      // parts[5]: ÖİV

      if (parts.length >= 6) {
        const phoneNo = parts[0].trim().slice(-10); // Son 10 hane (başına 0 ekleme matcher'da yapılır)
        const amount = parseFloat(parts[2].replace(',', '.')) || 0;
        const total_amount = parseFloat(parts[3].replace(',', '.')) || 0;
        const tax_kdv = parseFloat(parts[4].replace(',', '.')) || 0;
        const tax_oiv = parseFloat(parts[5].replace(',', '.')) || 0;

        extractedRecords.push({
          phoneNo: '0' + phoneNo, // Başına 0 ekleyerek standartlaştır
          amount: amount,
          tax_kdv: tax_kdv,
          tax_oiv: tax_oiv,
          total_amount: total_amount,
          tariff: parts[1].trim()
        });
      }
    }
  }

  // Period bilgisini çek (opsiyonel, matcher'da kullanılırsa diye)
  // const period = invoice['cac:InvoicePeriod']; 

  return extractedRecords;
}

module.exports = { parseInvoiceXML };
