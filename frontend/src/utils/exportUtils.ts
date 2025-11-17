import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";   // ✅ MUST USE THIS
import { Transaction } from "@/services/transactionService";

export const exportToPDF = (
  transactions: Transaction[],
  title: string,
  stats: any,
  role: "PRODUCER" | "BUYER"
) => {
  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(title, 14, 15);

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    // Stats
    doc.setFontSize(12);
    let yPosition = 35;

    if (stats.totalRevenue) {
      doc.text(`Total Revenue: ${stats.totalRevenue} ETB`, 14, yPosition);
      yPosition += 7;
    }

    if (stats.totalSpent) {
      doc.text(`Total Spent: ${stats.totalSpent} ETB`, 14, yPosition);
      yPosition += 7;
    }

    if (stats.completedSales) {
      doc.text(`Completed Sales: ${stats.completedSales}`, 14, yPosition);
      yPosition += 7;
    }

    if (stats.completedOrders) {
      doc.text(`Completed Orders: ${stats.completedOrders}`, 14, yPosition);
      yPosition += 7;
    }

    yPosition += 10;

    // Table columns
    const tableColumn = [
      "ID",
      "Order ID",
      role === "PRODUCER" ? "Buyer" : "Product",
      "Amount",
      "Date",
      "Status",
      "Blockchain",
    ];

    const tableRows: any[] = [];

    transactions.forEach((transaction) => {
      const blockchainStatus = transaction.blockchainStatus.verified
        ? "Verified"
        : transaction.blockchainStatus.status === "pending_verification"
        ? "Pending"
        : "Awaiting";

      const transactionData = [
        transaction.id,
        transaction.orderId,
        role === "PRODUCER"
          ? transaction.buyerName
          : transaction.items[0]?.product,
        `${transaction.amount} ETB`,
        new Date(transaction.date).toLocaleDateString(),
        transaction.status.toUpperCase(),
        blockchainStatus,
      ];

      tableRows.push(transactionData);
    });

    // AutoTable (✓ FIXED)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPosition,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    const fileName = `${title.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error("PDF export error:", error);
    return false;
  }
};
