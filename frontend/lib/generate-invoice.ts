"use client";

import { jsPDF } from "jspdf";
import type { Order } from "@/lib/api";

export function generateInvoicePDF(order: Order, locale: string) {
  const doc = new jsPDF();
  const isSq = locale === "sq";
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const red = [200, 16, 46] as const; // #C8102E
  const dark = [24, 24, 27] as const;
  const gray = [113, 113, 122] as const;

  // Header - Company
  doc.setFontSize(22);
  doc.setTextColor(...red);
  doc.text("Shqiponja eSIM", 20, 25);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text("shqiponjaesim.com", 20, 32);
  doc.text("info@shqiponjaesim.com", 20, 37);

  // Invoice title (right side)
  doc.setFontSize(28);
  doc.setTextColor(...dark);
  doc.text(isSq ? "FATURË" : "INVOICE", pageWidth - 20, 25, { align: "right" });

  // Invoice number and date
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(`#INV-${String(order.id).padStart(5, "0")}`, pageWidth - 20, 33, { align: "right" });
  const date = new Date(order.created_at).toLocaleDateString(
    isSq ? "sq-AL" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  doc.text(date, pageWidth - 20, 39, { align: "right" });

  // Red line separator
  doc.setDrawColor(...red);
  doc.setLineWidth(0.8);
  doc.line(20, 45, pageWidth - 20, 45);

  // Customer info
  let y = 58;
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(isSq ? "Faturuar për:" : "Billed to:", 20, y);
  y += 7;
  doc.setTextColor(...dark);
  doc.setFontSize(11);
  if (order.customer_name) {
    doc.text(order.customer_name, 20, y);
    y += 6;
  }
  doc.setFontSize(10);
  doc.text(order.email, 20, y);
  y += 6;
  if (order.phone) {
    doc.text(order.phone, 20, y);
    y += 6;
  }

  // Payment info (right side)
  const rightX = pageWidth - 20;
  let ry = 58;
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(isSq ? "Pagesa:" : "Payment:", rightX, ry, { align: "right" });
  ry += 7;
  doc.setTextColor(...dark);
  doc.text(
    order.payment_status === "paid"
      ? (isSq ? "E paguar" : "Paid")
      : (isSq ? "Në pritje" : "Pending"),
    rightX,
    ry,
    { align: "right" }
  );

  // Table header
  y = Math.max(y, ry) + 16;
  doc.setFillColor(244, 244, 245); // zinc-100
  doc.rect(20, y - 5, pageWidth - 40, 10, "F");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(isSq ? "Përshkrimi" : "Description", 25, y + 1);
  doc.text(isSq ? "Sasia" : "Qty", 120, y + 1, { align: "center" });
  doc.text(isSq ? "Çmimi" : "Price", pageWidth - 25, y + 1, { align: "right" });

  // Table row
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const packageDesc = `${order.package_name} — eSIM`;
  doc.text(packageDesc, 25, y);
  doc.text("1", 120, y, { align: "center" });
  const price = order.package_price ? Number(order.package_price).toFixed(2) : "—";
  doc.text(`€${price}`, pageWidth - 25, y, { align: "right" });

  // Subtotal line
  y += 12;
  doc.setDrawColor(228, 228, 231); // zinc-200
  doc.setLineWidth(0.3);
  doc.line(100, y, pageWidth - 20, y);

  // Total
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(isSq ? "Totali:" : "Total:", 100, y);
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.text(`€${price}`, pageWidth - 25, y, { align: "right" });

  // Order ID & ICCID info
  y += 20;
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`${isSq ? "Porosia" : "Order"} #${order.id}`, 20, y);
  if (order.iccid) {
    y += 6;
    doc.text(`ICCID: ${order.iccid}`, 20, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(...red);
  doc.setLineWidth(0.4);
  doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(
    isSq ? "Faleminderit për blerjen tuaj! — Shqiponja eSIM" : "Thank you for your purchase! — Shqiponja eSIM",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.save(`Shqiponja-eSIM-Invoice-${order.id}.pdf`);
}
