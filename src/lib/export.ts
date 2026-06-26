/**
 * Tiny, dependency-free CSV export helper.
 * Read-only utility: serialises an array of flat records to CSV and triggers a
 * client-side download. Keys of the first row define the column order/header.
 */

/** Escape a single CSV cell value (RFC-4180 quoting). */
function toCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  // Quote if the value contains a comma, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from rows. Column order follows the union of all keys. */
export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  // Preserve insertion order, but include any keys missing from the first row.
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  const lines = [headers.map(toCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => toCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Build a CSV from `rows` and trigger a browser download.
 * No-op outside the browser (guards against SSR).
 */
export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  if (typeof window === "undefined") return;
  const csv = rowsToCsv(rows);
  // Prepend a UTF-8 BOM so Excel renders accented characters correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
