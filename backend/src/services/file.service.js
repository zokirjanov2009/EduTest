// src/services/file.service.js
const pdfParse = require("pdf-parse");
const mammoth  = require("mammoth");
const XLSX     = require("xlsx");

// ===== PARSE PDF =====
const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer, { max: 50 });
    let text = (data.text || "")
      .replace(/\x00/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n")
      .trim();

    if (!text || text.length < 30) {
      throw new Error(
        "PDF dan matn ajratib bo'lmadi. Iltimos, matn formatidagi PDF yuklang (skaner qilingan emas)."
      );
    }

    return {
      text: text.substring(0, 15000),
      pages: data.numpages || 1,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch (e) {
    if (e.message.includes("matn ajratib")) throw e;
    throw new Error(
      "PDF o'qishda xatolik. PDF parolsiz va matn formatida bo'lsin."
    );
  }
};

// ===== PARSE DOCX =====
const parseDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text   = (result.value || "").trim();
    if (!text || text.length < 30) {
      throw new Error("Word hujjatida matn topilmadi.");
    }
    return {
      text: text.substring(0, 15000),
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch (e) {
    if (e.message.includes("topilmadi")) throw e;
    throw new Error("Word hujjatini o'qishda xatolik yuz berdi.");
  }
};

// ===== PARSE XLSX =====
const parseXLSX = async (buffer) => {
  try {
    const wb   = XLSX.read(buffer, { type: "buffer" });
    let fullText = "";

    wb.SheetNames.forEach((name) => {
      const ws   = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      fullText  += `\n=== ${name} ===\n`;
      rows.forEach((row) => {
        const line = row.filter((c) => c !== "").join(" | ");
        if (line) fullText += line + "\n";
      });
    });

    const text = fullText.trim();
    if (!text || text.length < 30) {
      throw new Error("Excel faylida ma'lumot topilmadi.");
    }
    return {
      text: text.substring(0, 15000),
      sheets: wb.SheetNames.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch (e) {
    if (e.message.includes("topilmadi")) throw e;
    throw new Error("Excel faylini o'qishda xatolik yuz berdi.");
  }
};

// ===== MAIN PARSER =====
const parseFile = async (buffer, fileType) => {
  switch (fileType) {
    case "PDF":  return parsePDF(buffer);
    case "DOCX": return parseDOCX(buffer);
    case "XLSX": return parseXLSX(buffer);
    default: throw new Error(`Qo'llab-quvvatlanmagan fayl turi: ${fileType}`);
  }
};

module.exports = { parseFile, parsePDF, parseDOCX, parseXLSX };
