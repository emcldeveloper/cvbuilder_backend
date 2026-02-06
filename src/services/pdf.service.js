import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import sanitize from "../utils/sanitize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPdf = async ({ template, name, applicantId }) => {
  if (!template || !name) {
    throw new Error("Missing template or name");
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    const url = `https://www.ekazi.com/cv/print/${template}?applicantId=${applicantId}`;
    const sanitizedName = sanitize(name);

    const fileName = `${sanitizedName}_${template}_${Date.now()}.pdf`;
    const fileDir = path.join(__dirname, "../../files");
    const filePath = path.join(fileDir, fileName);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    await page.addInitScript((id) => {
      localStorage.setItem("applicantId", id);
    }, applicantId);

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.emulateMedia({ media: "screen" });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return {
      link: `https://cvtemplate.ekazi.co.tz/api/files/${fileName}`,
    };
  } finally {
    await browser.close();
  }
};
