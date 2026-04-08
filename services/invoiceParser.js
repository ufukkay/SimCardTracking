const { PDFParse } = require('pdf-parse');

function parseAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    if (val > 1000000) return 0;
    return val;
  }
  
  let str = val.toString().trim().replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastDot > lastComma) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal dot
    } else {
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  const cleanStr = str.replace(/[\s\.\-]/g, ''); 
  if (/^5\d{9}$/.test(cleanStr) || /^05\d{9}$/.test(cleanStr)) {
    return 0;
  }

  if (num > 100000) {
    return 0;
  }

  return num;
}

/**
 * Parses a given PDF buffer and extracts invoice lines.
 * Returns an array of records: { phoneNo, amount, tax_kdv, tax_oiv, total_amount, tariff }
 */
async function parseInvoicePDF(fileBuffer) {
  const records = [];
  const parser = new PDFParse({ data: fileBuffer });
  let pdfResult;
  try {
    pdfResult = await parser.getText();
  } catch (err) {
    throw new Error('PDF okunamadı: ' + err.message);
  } finally {
    await parser.destroy();
  }

  if (!pdfResult || !pdfResult.text) {
    return records;
  }

  const normalizedText = pdfResult.text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n');


  // ─── TABLO İZOLASYONU (DAHA HASSAS) ───
  let processingText = normalizedText;
  // Sadece 'ÜCRET DETAYLARI' yetmiyor, tablonun içindeki gerçek başlıkları (GSM, TARİFE MODELİ vb.) arıyoruz.
  const startRegex = /GSM\s+TARİFE\s+MODELİ\s+FATURA\s+TUTARI/i;
  const endRegex = /TAAHHÜT\s*BİLGİ/i;
  
  const startMatch = normalizedText.match(startRegex);
  if (startMatch) {
    const textFromStart = normalizedText.substring(startMatch.index);
    const endMatch = textFromStart.match(endRegex);
    
    if (endMatch) {
      processingText = textFromStart.substring(0, endMatch.index);
      console.log(`[Parser] Tablo hassas izole edildi: Index ${startMatch.index} -> ${endMatch.index}`);
    } else {
      processingText = textFromStart;
      console.log("[Parser] Tablo başlığı bulundu ama Taahhüt sonu bulunamadı.");
    }
  } else {
    console.warn("[Parser] 'GSM TARİFE MODELİ' gibi tablo başlıkları bulunamadı. Genel tarama yapılıyor.");
  }

  const flexiblePhonePattern = /(?:\+?90[\s\-.()]*|0[\s\-.()]*)?5(?:[\s\-.()]*\d){9}/g;
  let phoneMatches = [...processingText.matchAll(flexiblePhonePattern)];
  if (!phoneMatches.length) {
    phoneMatches = [...processingText.matchAll(/5\d{9}/g)];
  }

  const pdfRowKeys = new Set();

  if (phoneMatches.length) {
    phoneMatches.forEach((rawMatch) => {
      if (!rawMatch || !rawMatch[0]) return;
      const rawPhone = rawMatch[0];
      const startIdx = rawMatch.index || 0;
      // Satır okumak için bir pencere (window) açıyoruz
      const windowEnd = Math.min(startIdx + 600, normalizedText.length);
      let chunk = normalizedText.slice(startIdx, windowEnd).replace(/\s+/g, ' ').trim();
      if (!chunk) return;

      const phoneDigits = rawPhone.replace(/\D/g, '');
      const phoneNoOriginal = phoneDigits.slice(-10);
      if (phoneNoOriginal.length !== 10) return;
      const phoneNo = '0' + phoneNoOriginal; 

      const phonePatternForRemoval = new RegExp(phoneNoOriginal.split('').join('[\\s\\-.()]*'), 'i');
      const chunkWithoutPhone = chunk.replace(phonePatternForRemoval, ' ').replace(/\s+/g, ' ').trim();
      if (!chunkWithoutPhone) return;

      const numberTokens = (chunkWithoutPhone.match(/[-+]?\d[\d.,']*/g) || [])
        .filter(tok => !/^\d{2}\.\d{2}\.\d{4}$/.test(tok) && tok.replace(/\D/g, '').length < 11)
        .slice(0, 8);

      if (!numberTokens.length) return;

      const numericValues = numberTokens
        .map(tok => parseAmount(tok.replace(/'/g, '')))
        .filter(val => !Number.isNaN(val) && val > 0);

      // En az 2 sayısal değer olmalı (Tutar ve Toplam Tutar gibi). 
      // Taahhüt tablosundaki "17" gibi tek sayılık satırları elemeye yardımcı olur.
      if (numericValues.length < 2) return;

      let amount = 0;
      let total_amount = 0;
      let tax_kdv = 0;
      let tax_oiv = 0;

      if (numericValues.length >= 4) {
        total_amount = numericValues[1];
        tax_kdv = numericValues[2];
        tax_oiv = numericValues[3];
        amount = Math.max(total_amount - tax_kdv - tax_oiv, 0);
      } else if (numericValues.length === 3) {
        amount = numericValues[0];
        total_amount = numericValues[1];
        tax_kdv = numericValues[2];
      } else if (numericValues.length === 2) {
        amount = numericValues[0];
        total_amount = numericValues[1];
        tax_kdv = Math.max(total_amount - amount, 0);
      } else {
        amount = numericValues[0];
        total_amount = amount;
      }

      if (total_amount === 0) return;

      const tariff = (() => {
        const beforeNumbers = chunkWithoutPhone.split(/[-+]?\d[\d.,']*/)[0] || '';
        const cleaned = beforeNumbers.replace(/TL|₺/gi, '').replace(/\s+/g, ' ').trim();
        return cleaned || 'PDF Satırı';
      })();

      const recordKey = `${phoneNo}-${amount}-${total_amount}`;
      if (pdfRowKeys.has(recordKey)) return; // prevent duplicate reading of same line
      pdfRowKeys.add(recordKey);

      records.push({
        phoneNo,
        amount,
        tax_kdv,
        tax_oiv,
        total_amount,
        tariff
      });
    });
  }

  return records;
}

module.exports = {
  parseInvoicePDF,
  parseAmount
};
