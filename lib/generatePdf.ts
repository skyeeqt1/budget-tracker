import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import {
  StorageAccessFramework,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";

import { getCategory } from "@/constants/categories";
import { Expense, BudgetSheet, BudgetSummary } from "@/types";
import { formatCurrency, formatDateLong, formatDateShort } from "@/lib/format";

interface PdfOptions {
  sheet: BudgetSheet;
  expenses: Expense[];
  summary: BudgetSummary;
}

const A4: [number, number] = [595.28, 841.89];

/** Currency string safe for standard PDF fonts (replaces ₱ with PHP). */
function pdfCurrency(amount: number): string {
  return formatCurrency(amount).replace("₱", "PHP ");
}

/** Hex color → pdf-lib rgb (0–1). */
function hex(h: string) {
  const s = h.replace("#", "");
  return rgb(
    parseInt(s.substring(0, 2), 16) / 255,
    parseInt(s.substring(2, 4), 16) / 255,
    parseInt(s.substring(4, 6), 16) / 255
  );
}

export async function generateBudgetPdf(options: PdfOptions): Promise<string | null> {
  const { sheet, expenses, summary } = options;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage(A4);
  const m = 56;
  const cw = page.getWidth() - m * 2;

  const dark = hex("#1A1630");
  const muted = hex("#64748B");
  const lightBg = hex("#F8F7FF");
  const borderCol = hex("#E2E0ED");
  const green = hex("#10B981");
  const red = hex("#E11D48");
  const headerBg = hex("#F0EEFF");

  let y = page.getHeight() - m;

  const line = (h: number) => { y -= h; };

  const rect = (
    rx: number,
    ry: number,
    w: number,
    h: number,
    color: ReturnType<typeof rgb>,
    border = true
  ) => {
    page.drawRectangle({
      x: rx,
      y: ry,
      width: w,
      height: h,
      color,
      borderColor: border ? borderCol : undefined,
      borderWidth: border ? 0.5 : 0,
    });
  };

  const newPage = () => {
    page = doc.addPage(A4);
    y = page.getHeight() - m;
  };

  // ── Header ──
  page.drawText("Budget Record", { x: m, y, size: 22, font: bold, color: dark });
  line(28);
  page.drawText(`Budget Tracker  ·  ${formatDateLong(sheet.startDate)}`, { x: m, y, size: 10, font, color: muted });
  line(20);

  // ── Period card ──
  const periodH = 40;
  rect(m, y - periodH, cw, periodH, lightBg);
  page.drawText("PERIOD", { x: m + 14, y: y - 14, size: 7, font, color: muted });
  page.drawText(`${formatDateLong(sheet.startDate)}  –  ${formatDateLong(sheet.endDate)}`, {
    x: m + 14, y: y - 28, size: 11, font: bold, color: dark,
  });
  line(periodH + 14);

  // ── Summary cards ──
  const cardGap = 10;
  const cardW = (cw - cardGap * 2) / 3;
  const cardH = 42;
  const cards = [
    { label: "BUDGET", value: pdfCurrency(summary.budget), c: dark },
    { label: "SPENT", value: pdfCurrency(summary.spent), c: dark },
    { label: "REMAINING", value: pdfCurrency(summary.remaining), c: summary.overBudget ? red : green },
  ];

  cards.forEach((c, i) => {
    const cx = m + i * (cardW + cardGap);
    rect(cx, y - cardH, cardW, cardH, lightBg);
    page.drawText(c.label, { x: cx + 12, y: y - 14, size: 7, font, color: muted });
    page.drawText(c.value, { x: cx + 12, y: y - 32, size: 13, font: bold, color: c.c });
  });
  line(cardH + 14);

  // ── Status badge ──
  const statusLabel = summary.overBudget ? "Over Budget" : "Within Budget";
  const badgeText = `${statusLabel}  ·  ${Math.round(summary.ratio * 100)}% used`;
  page.drawText(badgeText, { x: m, y, size: 10, font: bold, color: summary.overBudget ? red : green });
  line(18);

  // ── Expenses heading ──
  page.drawText(`Expenses (${expenses.length})`, { x: m, y, size: 14, font: bold, color: dark });
  line(18);

  // ── Table header ──
  const headerRowH = 22;
  rect(m, y - headerRowH, cw, headerRowH, headerBg, false);

  const colX = [m + 8, m + 80, m + 280, m + cw - 8];
  const headers = ["DATE", "TITLE", "CATEGORY", "AMOUNT"];
  headers.forEach((h, i) => {
    const isRight = i === 3;
    const x = isRight
      ? m + cw - 8 - bold.widthOfTextAtSize(h, 7)
      : colX[i];
    page.drawText(h, { x, y: y - 15, size: 7, font: bold, color: muted });
  });
  line(headerRowH);

  // ── Table rows ──
  const rowH = 22;

  if (expenses.length === 0) {
    const noExpText = "No expenses recorded.";
    const noExpW = font.widthOfTextAtSize(noExpText, 10);
    page.drawText(noExpText, { x: (page.getWidth() - noExpW) / 2, y: y - 16, size: 10, font, color: muted });
    line(32);
  } else {
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];

      if (y - rowH < m + 60) {
        newPage();
      }

      if (i % 2 === 0) {
        rect(m, y - rowH, cw, rowH, lightBg, false);
      }

      const cat = getCategory(e.category);
      const ty = y - 15;

      page.drawText(formatDateShort(e.date), { x: colX[0], y: ty, size: 9, font, color: dark });

      let title = e.title;
      while (font.widthOfTextAtSize(title, 9) > 190 && title.length > 3) {
        title = title.slice(0, -1);
      }
      if (title !== e.title) title += "…";
      page.drawText(title, { x: colX[1], y: ty, size: 9, font, color: dark });

      page.drawText(cat.label, { x: colX[2], y: ty, size: 9, font, color: muted });

      const amt = `-${pdfCurrency(e.amount)}`;
      const amtW = font.widthOfTextAtSize(amt, 9);
      page.drawText(amt, { x: colX[3] - amtW, y: ty, size: 9, font, color: dark });

      line(rowH);
    }
  }

  // Table border
  const tableH = expenses.length > 0 ? expenses.length * rowH + headerRowH : headerRowH + 32;
  page.drawRectangle({ x: m, y, width: cw, height: tableH, borderColor: borderCol, borderWidth: 0.5 });
  line(16);

  // ── Footer ──
  page.drawLine({ start: { x: m, y }, end: { x: m + cw, y }, color: borderCol, thickness: 0.5 });
  line(16);

  const footer = `Generated by Budget Tracker  ·  ${formatDateLong(new Date().toISOString().slice(0, 10))}`;
  const footerW = font.widthOfTextAtSize(footer, 8);
  page.drawText(footer, { x: (page.getWidth() - footerW) / 2, y, size: 8, font, color: muted });

  // ── Write file & save ──
  const bytes = await doc.save();
  const b64 = uint8ToBase64(bytes);

  if (Platform.OS === "android") {
    // SAF: user picks a folder, file is saved there
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return null;

    // e.g. "08-05-26"
    const [yyyy, mm, dd] = sheet.startDate.split("-");
    const fileName = `${mm}-${dd}-${yyyy.slice(2)}`;

    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "application/pdf"
    );
    await writeAsStringAsync(fileUri, b64, { encoding: EncodingType.Base64 });
    return `${fileName}.pdf`;
  } else {
    // iOS: share sheet (which has a "Save to Files" option)
    const { cacheDirectory } = await import("expo-file-system/legacy");
    const fileUri = (cacheDirectory ?? "") + "budget-record.pdf";
    await writeAsStringAsync(fileUri, b64, { encoding: EncodingType.Base64 });
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Save Budget Record",
    });
    return null;
  }
}

/** Uint8Array → base64 (Hermes-safe, no atob/btoa). */
function uint8ToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[(b0 >> 2) & 0x3f];
    result += chars[((b0 << 4) | (b1 >> 4)) & 0x3f];
    result += i + 1 < bytes.length ? chars[((b1 << 2) | (b2 >> 6)) & 0x3f] : "=";
    result += i + 2 < bytes.length ? chars[b2 & 0x3f] : "=";
  }
  return result;
}
