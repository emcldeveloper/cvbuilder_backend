const express = require("express");
const app = express();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "https://ekazi.co.tz"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/files", express.static("files"));

const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9_-]/g, "_");

app.get("/generatePdf", async (req, res) => {
  const { template, name } = req.query;

  if (!template || !name) {
    return res.status(400).json({
      status: false,
      message: "Missing template or name."
    });
  }

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    const url = `https://ekazi.co.tz/template${template}`;
    const sanitizedName = sanitize(name);

    const fileName = `${sanitizedName}_${template}_${Date.now()}.pdf`;
    const fileDir = path.join(__dirname, "files");
    const filePath = path.join(fileDir, fileName);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    await page.goto(url, { waitUntil: "networkidle" });

    await page.waitForSelector("#data", { timeout: 15000 }).catch(() => {
      console.log("⚠ #data NOT found, generating PDF anyway...");
    });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.status(200).json({
      status: true,
      body: {
        link: `https://cvtemplate.ekazi.co.tz/files/${fileName}`
      }
    });

  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    res.status(500).json({
      status: false,
      message: "PDF generation failed.",
      error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3999, () => {
  console.log("PDF Server running on https://cvtemplate.ekazi.co.tz/");
});
