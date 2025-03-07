const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

// Middleware
app.use(express.json());
app.use('/files', express.static('files')); // Serve static files from the "files" directory
app.use(bodyParser.text({ type: '/' }));
app.use(cors({
    origin: 'https://cvbuilder.ekazi.co.tz',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type'],
}));

// Function to sanitize file names
const sanitize = (str) => str.replace(/[^a-zA-Z0-9_-]/g, '_');

// Proxy route
// app.use('/proxy', async (req, res) => {
//     try {
//         const targetUrl = `https://cvtemplate.ekazi.co.tz${req.url}`;
//         const response = await axios({
//             method: req.method,
//             url: targetUrl,
//             data: req.body,
//             headers: req.headers,
//         });
//         res.status(response.status).send(response.data);
//     } catch (error) {
//         console.error('Proxy error:', error.message);
//         res.status(500).send({
//             status: false,
//             message: 'Proxy request failed.',
//             error: error.message,
//         });
//     }
// });

// PDF generation route
app.get('/generatePdf', async (req, res) => {
    const { uuid, template, name } = req.query;

    if (!uuid || !template || !name) {
        return res.status(400).send({
            status: false,
            message: 'Missing required query parameters: uuid, template, or name.',
        });
    }

    let browser;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();

        const url = `https://cvbuilder.ekazi.co.tz/template${template}/${uuid}`;
        const sanitizedName = sanitize(name);
        const fileName = `${sanitizedName}_${template}_${Date.now()}CV.pdf`;
        const filesDir = path.join(__dirname, 'files');
        const filePath = path.join(filesDir, fileName);

        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector('#data', { timeout: 60000 }).catch(() => {
            console.warn('The #data element is not present on the page.');
        });

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { bottom: 30, top: template == 1 ? 30 : 0 },
        });

        res.status(200).json({
            status: true,
            body: {
                link: `https://cvtemplate.ekazi.co.tz/files/${fileName}`,
            },
        });
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        res.status(500).send({
            status: false,
            message: 'Failed to generate PDF.',
            error: error.message,
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Start the server
app.listen(5001, () => {
    console.log('Server started at http://localhost:5001');
});