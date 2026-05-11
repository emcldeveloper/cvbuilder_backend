import { getBrowser } from "../utils/browser.js";

export const generatePdf = async (req, res) => {
  try {
    const {
      html,
      watermark = true,
      logoBase64 = "",
      watermarkBase64 = "",
    } = req.body;

    if (!html)
      return res.status(400).json({ error: "HTML content is required" });

    // ── Watermark CSS ──────────────────────────────────────────────────
    const watermarkStyle =
      watermark && watermarkBase64
        ? `
      body::after {
        content: "";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1200px;
        height: 100%;
        background-image: url("${watermarkBase64}");
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        opacity: 0.07;
        pointer-events: none;
        z-index: 9999;
      }
    `
        : watermark
          ? `
      body::after {
        content: "ekazi.co.tz";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 72px;
        font-weight: 700;
        color: #000;
        opacity: 0.06;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        font-family: Helvetica Neue, Arial, sans-serif;
      }
    `
          : "";

    const browser = await getBrowser();
    const page = await browser.newPage();

    // ── Inject full HTML with styles ───────────────────────────────────
    await page.setContent(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: sans-serif; background: #fff; }

            ${watermarkStyle}

            /* Page break rules */
            p, li, h1, h2, h3, h4 {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .experience-item, .education-item,
            .referee-item, .cv-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            h2, h3, h4 {
              break-after: avoid;
              page-break-after: avoid;
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `,
      { waitUntil: "domcontentloaded" },
    );

    await page.emulateMediaType("print");

    // ── Footer rendered on every page by Puppeteer ─────────────────────
    const footerHtml = watermark
      ? `
      <div style="
        width: 100%;
        padding: 6px 52px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #9ca3af;
        font-family: Helvetica Neue, Arial, sans-serif;
        box-sizing: border-box;
      ">
        <span>Powered by ekazi</span>
        <div style="display:flex; align-items:center; gap:6px;">
          ${
            logoBase64
              ? `<img src="${logoBase64}" style="height:12px; object-fit:contain;" />`
              : `<span style="font-weight:600; color:#6b7280;">ekazi</span>`
          }
        </div>
      </div>
    `
      : "<span></span>";

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerHtml,
      margin: {
        top: "10mm",
        bottom: "18mm",
        left: "0mm",
        right: "0mm",
      },
    });

    await page.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": 'attachment; filename="cv.pdf"',
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    console.error(error);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);

    res
      .status(500)
      .json({ error: "Failed to generate PDF", message: error.message });
  }
};
