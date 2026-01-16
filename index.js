// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser');
// const { chromium } = require('playwright');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');

// // Fix CORS
// app.use(cors({ origin: "http://localhost:3000" }));

// app.use(express.json());
// app.use('/files', express.static('files'));
// app.use(bodyParser.text({ type: '/' }));

// const sanitize = (str) => str.replace(/[^a-zA-Z0-9_-]/g, '_');

// app.get('/generatePdf', async (req, res) => {
//     const {template, name } = req.query;

//     if (!template || !name) {
//         return res.status(400).send({
//             status: false,
//             message: 'Missing required query parameters: uuid, template, or name.',
//         });
//     }

//     let browser;
//     try {
//         browser = await chromium.launch();
//         const page = await browser.newPage();

//         const url = `http://localhost:3000/template${template}`;
//         const sanitizedName = sanitize(name);
//         const fileName = `${sanitizedName}_${template}_${Date.now()}CV.pdf`;
//         const filesDir = path.join(__dirname, 'files');
//         const filePath = path.join(filesDir, fileName);

//         if (!fs.existsSync(filesDir)) {
//             fs.mkdirSync(filesDir, { recursive: true });
//         }

//         await page.goto(url, { waitUntil: 'networkidle' });

//         await page.waitForSelector('#data', { timeout: 60000 }).catch(() => {
//             console.warn('The #data element is not present on the page.');
//         });

//         await page.pdf({
//             path: filePath,
//             format: 'A4',
//             printBackground: true,
//             preferCSSPageSize: true,
//             margin: { bottom: 30, top: template == 1 ? 30 : 0 },
//         });

//         res.status(200).json({
//             status: true,
//             body: {
//                 link: `http://localhost:5001/files/${fileName}`,
//             },
//         });
//     } catch (error) {
//         console.error('Failed to generate PDF:', error);
//         res.status(500).send({
//             status: false,
//             message: 'Failed to generate PDF.',
//             error: error.message,
//         });
//     } finally {
//         if (browser) await browser.close();
//     }
// });

// app.listen(5001, () => {
//     console.log('Server started at http://localhost:5001');
// });
const express = require("express");
const app = express();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

// app.use(cors({ origin: "http://localhost:3000" }));
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

        console.log("Opening URL:", url);

        await page.goto(url, { waitUntil: "networkidle" });

        // Wait for your CV container
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

app.listen(5001, () => {
    console.log("PDF Server running on https://cvtemplate.ekazi.co.tz/");
});
