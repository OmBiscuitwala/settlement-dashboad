import jsPDF from "jspdf";

export function generateSettlementPDF(merchant, netPayable) {
  const doc = new jsPDF();

  const refId = "SETTLE-" + Math.floor(Math.random() * 100000);
  const timestamp = new Date().toLocaleString();

  doc.setFontSize(16);
  doc.text("Settlement Packet Report", 20, 20);

  doc.setFontSize(12);
  doc.text("Merchant Details:", 20, 35);
  doc.text(`Name: ${merchant.name}`, 20, 45);
  doc.text(`Merchant ID: ${merchant.id}`, 20, 55);
  doc.text(`Bank Account: ${merchant.bank}`, 20, 65);

  doc.text("Settlement Summary:", 20, 85);
  doc.text(`Net Payable Amount: ₹${netPayable}`, 20, 95);

  doc.text("Approval Signature:", 20, 115);
  doc.text("Approved By: OpsManager", 20, 125);

  doc.text("Settlement Metadata:", 20, 145);
  doc.text(`Reference ID: ${refId}`, 20, 155);
  doc.text(`Timestamp: ${timestamp}`, 20, 165);

  doc.save(`${merchant.id}_Settlement_Report.pdf`);
}
