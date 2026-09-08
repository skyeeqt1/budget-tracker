import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { getCategory } from "@/constants/categories";
import { Expense, BudgetSheet, BudgetSummary } from "@/types";
import { formatCurrency, formatDateLong, formatDateShort } from "@/lib/format";

interface PdfOptions {
  sheet: BudgetSheet;
  expenses: Expense[];
  summary: BudgetSummary;
}

function buildExpenseRows(expenses: Expense[]): string {
  if (expenses.length === 0) {
    return `<tr><td colspan="4" style="padding:12px;text-align:center;color:#94A3B8;font-size:13px;">No expenses recorded.</td></tr>`;
  }

  return expenses
    .map((e, i) => {
      const cat = getCategory(e.category);
      const bg = i % 2 === 0 ? "#F8F7FF" : "#FFFFFF";
      return `
        <tr style="background:${bg}">
          <td style="padding:10px 12px;font-size:13px;color:#1E293B;">${formatDateShort(e.date)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#1E293B;">${escapeHtml(e.title)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#64748B;">${escapeHtml(cat.label)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#1E293B;text-align:right;font-weight:600;">-${formatCurrency(e.amount)}</td>
        </tr>`;
    })
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml({ sheet, expenses, summary }: PdfOptions): string {
  const statusColor = summary.overBudget ? "#E11D48" : "#10B981";
  const statusLabel = summary.overBudget ? "Over Budget" : "Within Budget";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; padding: 24px; font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1E293B; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="margin-bottom:28px;">
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1A1630;">Budget Record</h1>
    <p style="margin:0;font-size:13px;color:#64748B;">Budget Tracker &middot; ${formatDateLong(sheet.startDate)}</p>
  </div>

  <!-- Date Range -->
  <div style="background:#F8F7FF;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #E2E0ED;">
    <p style="margin:0 0 4px;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Period</p>
    <p style="margin:0;font-size:15px;font-weight:600;color:#1A1630;">${formatDateLong(sheet.startDate)} &ndash; ${formatDateLong(sheet.endDate)}</p>
  </div>

  <!-- Summary Cards -->
  <div style="display:flex;gap:12px;margin-bottom:24px;">
    <div style="flex:1;background:#F8F7FF;border-radius:10px;padding:14px 16px;border:1px solid #E2E0ED;">
      <p style="margin:0 0 2px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Budget</p>
      <p style="margin:0;font-size:17px;font-weight:700;color:#1A1630;">${formatCurrency(summary.budget)}</p>
    </div>
    <div style="flex:1;background:#F8F7FF;border-radius:10px;padding:14px 16px;border:1px solid #E2E0ED;">
      <p style="margin:0 0 2px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Spent</p>
      <p style="margin:0;font-size:17px;font-weight:700;color:#1A1630;">${formatCurrency(summary.spent)}</p>
    </div>
    <div style="flex:1;background:#F8F7FF;border-radius:10px;padding:14px 16px;border:1px solid #E2E0ED;">
      <p style="margin:0 0 2px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Remaining</p>
      <p style="margin:0;font-size:17px;font-weight:700;color:${statusColor};">${formatCurrency(summary.remaining)}</p>
    </div>
  </div>

  <!-- Status -->
  <div style="margin-bottom:24px;">
    <span style="display:inline-block;background:${statusColor}15;color:${statusColor};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
      ${statusLabel} &middot; ${Math.round(summary.ratio * 100)}% used
    </span>
  </div>

  <!-- Expenses Table -->
  <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1A1630;">Expenses (${expenses.length})</h2>
  <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #E2E0ED;">
    <thead>
      <tr style="background:#F0EEFF;">
        <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748B;text-align:left;text-transform:uppercase;letter-spacing:0.3px;">Date</th>
        <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748B;text-align:left;text-transform:uppercase;letter-spacing:0.3px;">Title</th>
        <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748B;text-align:left;text-transform:uppercase;letter-spacing:0.3px;">Category</th>
        <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#64748B;text-align:right;text-transform:uppercase;letter-spacing:0.3px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${buildExpenseRows(expenses)}
    </tbody>
  </table>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E2E0ED;">
    <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
      Generated by Budget Tracker &middot; ${formatDateLong(new Date().toISOString().slice(0, 10))}
    </p>
  </div>
</body>
</html>`;
}

export async function generateBudgetPdf(options: PdfOptions): Promise<void> {
  const html = buildHtml(options);

  // Generate PDF to a temp file
  const { uri: tempUri } = await Print.printToFileAsync({ html });

  // Copy to cache directory so expo-sharing can read it on Android
  const dest = new FileSystem.File(FileSystem.Paths.cache, "budget-record.pdf");
  await new FileSystem.File(tempUri).copy(dest);

  // Open the native share sheet
  await Sharing.shareAsync(dest.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Save Budget Record",
  });
}
