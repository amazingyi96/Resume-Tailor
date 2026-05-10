import { jsPDF } from "jspdf";

export function exportToPdf(resumeText: string, title: string): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  let y = margin;
  let page = 1;

  const lines = resumeText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 12;
    } else {
      const isBold =
        trimmed === "Professional Summary" ||
        trimmed === "Core Skills" ||
        trimmed === "Professional Experience" ||
        trimmed === "Education" ||
        trimmed === "Certifications" ||
        trimmed.includes("|");

      pdf.setFont("Helvetica", isBold ? "bold" : "normal");
      pdf.setFontSize(isBold ? 12 : 10);

      if (isBold && trimmed.length > 0 && !trimmed.includes("|")) {
        y += 8;
      }

      const textLines = pdf.splitTextToSize(trimmed, pageWidth - margin * 2);

      for (const textLine of textLines) {
        if (y > pageHeight - margin) {
          page++;
          pdf.addPage();
          y = margin;
        }
        pdf.text(textLine, margin, y);
        y += 14;
      }
    }
  }

  const blob = pdf.output("blob");
  return blob;
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
