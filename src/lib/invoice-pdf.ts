import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_NAME } from "@/lib/constants";
import type { Order } from "@/types";

/**
 * Render an order as a downloadable invoice PDF, entirely client-side.
 *
 * This is the fallback used when the backend's official (S3-hosted) invoice
 * isn't available — e.g. local dev where object storage isn't configured. It
 * mirrors the backend invoice layout closely enough to be useful, and always
 * reconciles to the order's authoritative `total_amount`.
 */
export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 48;
  let y = 56;

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ── Header ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(APP_NAME, marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    "Regional B2B Marketplace — Northeastern Pennsylvania",
    marginX,
    y + 16,
  );
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INVOICE", doc.internal.pageSize.getWidth() - marginX, y, {
    align: "right",
  });

  y += 44;

  // ── Order meta ─────────────────────────────────────────────────────
  const orderNo = `#${order.id.slice(0, 8).toUpperCase()}`;
  const placed = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaLeft = [
    `Order: ${orderNo}`,
    `Date: ${placed}`,
    `Status: ${order.status}`,
  ];
  metaLeft.forEach((line, i) => doc.text(line, marginX, y + i * 15));

  // Shipping / bill-to block (right column).
  const rightX = doc.internal.pageSize.getWidth() - marginX;
  doc.setFont("helvetica", "bold");
  doc.text("Ship to", rightX, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  const shipLines = [
    order.shipping_name,
    order.shipping_phone,
    order.shipping_address_line1,
    order.shipping_address_line2 || "",
    `${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}`,
  ].filter(Boolean);
  shipLines.forEach((line, i) =>
    doc.text(String(line), rightX, y + 15 + i * 13, { align: "right" }),
  );

  y += Math.max(metaLeft.length * 15, 15 + shipLines.length * 13) + 24;

  // ── Line items ─────────────────────────────────────────────────────
  const items = order.items ?? [];
  let subtotal = 0;
  const body = items.map((it) => {
    const unit = parseFloat(it.unit_price) || 0;
    const line = unit * it.quantity;
    subtotal += line;
    return [
      it.product_name ?? `Product ${it.product.slice(0, 8)}`,
      String(it.quantity),
      money(unit),
      money(line),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit price", "Line total"]],
    body,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 90 },
      3: { halign: "right", cellWidth: 90 },
    },
  });

  // ── Totals ─────────────────────────────────────────────────────────
  const total = parseFloat(order.total_amount) || subtotal;
  const adjustment = total - subtotal; // tax / fees baked into the order total
  // @ts-expect-error — lastAutoTable is added by jspdf-autotable at runtime.
  let ty = (doc.lastAutoTable?.finalY ?? y) + 18;
  const labelX = rightX - 150;

  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, labelX, ty);
    doc.text(value, rightX, ty, { align: "right" });
    ty += bold ? 20 : 16;
  };

  totalRow("Subtotal", money(subtotal));
  if (Math.abs(adjustment) >= 0.01) totalRow("Tax & fees", money(adjustment));
  totalRow("Total", money(total), true);

  // ── Footer ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    `Generated ${new Date().toLocaleString("en-US")} · ${APP_NAME}`,
    marginX,
    doc.internal.pageSize.getHeight() - 32,
  );

  doc.save(`invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
}
