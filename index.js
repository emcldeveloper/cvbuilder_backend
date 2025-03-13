const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
 

// Middleware
app.use(express.json());
app.use('/files', express.static('files')); // Serve static files from the "files" directory
app.use(bodyParser.text({ type: '/' }));
// app.use(cors({
//     origin: 'https://cvbuilder.ekazi.co.tz',
//     methods: ['GET', 'POST', 'PUT'],
//     allowedHeaders: ['Content-Type'],
// }));
const corsOptions = {  
    origin: 'https://cvbuilder.ekazi.co.tz',  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  
    credentials: true,  // Allows cookies and authentication headers  
    optionsSuccessStatus: 200  
};  

app.use(cors(corsOptions)); // Apply CORS globally 
// Function to sanitize file names
const sanitize = (str) => str.replace(/[^a-zA-Z0-9_-]/g, '_');

 
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