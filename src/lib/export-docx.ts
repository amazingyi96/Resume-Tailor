import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function exportToDocx(resumeText: string, title: string): Promise<Blob> {
  const lines = resumeText.split("\n");
  let inSkills = false;
  let afterSkills = false;

  const paragraphs = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return new Paragraph({ spacing: { after: 120 } });
    }

    const isSectionHeader =
      trimmed === "Professional Summary" ||
      trimmed === "Core Skills" ||
      trimmed === "Professional Experience" ||
      trimmed === "Education" ||
      trimmed === "Certifications";

    if (trimmed === "Core Skills") {
      inSkills = true;
    } else if (trimmed === "Professional Experience") {
      inSkills = false;
      afterSkills = true;
    }

    if (isSectionHeader) {
      return new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            bold: true,
            size: 26,
            font: "Calibri",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      });
    }

    if (inSkills && trimmed.includes("|")) {
      return new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { after: 60 },
      });
    }

    return new Paragraph({
      children: [
        new TextRun({
          text: trimmed,
          size: 22,
          font: "Calibri",
        }),
      ],
      spacing: { after: line.endsWith(":") || line.endsWith("|") ? 120 : 40 },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export function downloadDocx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
