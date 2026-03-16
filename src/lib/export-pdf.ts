import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface PdfOptions {
  title: string;
  subtitle: string;
  period: string;
  filename: string;
}

export async function exportDashboardPdf(
  elementId: string,
  options: PdfOptions
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Apply light theme temporarily for print readability
  const origBg = el.style.background;
  const origColor = el.style.color;
  el.style.background = "#ffffff";
  el.style.color = "#1a1a2e";

  // Override dark vars inside the captured element
  el.style.setProperty("--color-bg1", "#f8fafc");
  el.style.setProperty("--color-border", "#e2e8f0");
  el.style.setProperty("--color-text-primary", "#1e293b");
  el.style.setProperty("--color-text-secondary", "#475569");
  el.style.setProperty("--color-dim", "#64748b");

  // Add class for print-mode styling
  el.classList.add("pdf-capture-mode");

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Header
    pdf.setFontSize(18);
    pdf.setTextColor(30, 30, 60);
    pdf.text("Axiom", margin, 18);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Analytics Report", margin + 28, 18);

    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text(options.title, margin, 30);

    if (options.subtitle) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(options.subtitle, margin, 37);
    }

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(options.period, margin, options.subtitle ? 44 : 37);

    // Horizontal line
    const headerEnd = options.subtitle ? 48 : 41;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, headerEnd, pageWidth - margin, headerEnd);

    // Content image
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let yPos = headerEnd + 4;
    const availableHeight = pageHeight - yPos - 20; // Leave room for footer

    if (imgHeight <= availableHeight) {
      pdf.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight);
    } else {
      // Multi-page: split the image
      let srcY = 0;
      let pageNum = 1;
      const srcPerPage = (availableHeight / imgHeight) * canvas.height;

      while (srcY < canvas.height) {
        if (pageNum > 1) {
          pdf.addPage();
          yPos = margin;
        }

        const sliceHeight = Math.min(srcPerPage, canvas.height - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const sliceImg = sliceCanvas.toDataURL("image/png");
          const sliceH = (sliceHeight * imgWidth) / canvas.width;
          pdf.addImage(sliceImg, "PNG", margin, yPos, imgWidth, sliceH);
        }

        srcY += sliceHeight;
        pageNum++;
      }
    }

    // Footer on all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Gerado por Axiom — axiom-solver.com`,
        margin,
        pageHeight - 8
      );
      pdf.text(
        `${i}/${totalPages}`,
        pageWidth - margin - 10,
        pageHeight - 8
      );
    }

    pdf.save(options.filename);
  } finally {
    // Restore original styles
    el.style.background = origBg;
    el.style.color = origColor;
    el.style.removeProperty("--color-bg1");
    el.style.removeProperty("--color-border");
    el.style.removeProperty("--color-text-primary");
    el.style.removeProperty("--color-text-secondary");
    el.style.removeProperty("--color-dim");
    el.classList.remove("pdf-capture-mode");
  }
}
