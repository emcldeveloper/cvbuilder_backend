const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const axios = require('axios'); // Add axios for making HTTP requests

app.use(express.json());
app.use('/files', express.static('files')); // Serve static files from the "files" directory
app.use(bodyParser.text({ type: '/' }));
// Function to sanitize file names
const sanitize = (str) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
 
 ;
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://cvbuilder.ekazi.co.tz");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
// Proxy route
app.use('/proxy', async (req, res) => {
    try {
        // Construct the target URL
        const targetUrl = `https://cvtemplate.ekazi.co.tz${req.url}`;

        // Forward the request to the target server
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                ...req.headers,
                host: 'cvtemplate.ekazi.co.tz', // Set the correct host header
            },
        });

        // Send the response back to the client
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send({
            status: false,
            message: 'Proxy request failed.',
            error: error.message,
        });
    }
});


app.get('/generatePdf', async (req, res) => {
    try {
        const { uuid, template, name } = req.query;

        // Validate required query parameters
        if (!uuid || !template || !name) {
            return res.status(400).send({
                status: false,
                message: 'Missing required query parameters: uuid, template, or name.',
            });
        }

        // Launch the browser
        const browser = await chromium.launch();
        const page = await browser.newPage();

        // Construct the URL and file path
        const url = `https://cvbuilder.ekazi.co.tz/template${template}/${uuid}`;
        const sanitizedName = sanitize(name); // Sanitize the name
        const fileName = `${sanitizedName}_${template}_${Date.now()}CV.pdf`; // Unique file name
        const filesDir = path.join(__dirname, 'files'); // Absolute path to the "files" directory
        const filePath = path.join(filesDir, fileName); // Absolute path to the PDF file

        console.log('Constructed URL:', url);
        console.log('File path:', filePath);

        // Ensure the "files" directory exists
        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true }); // Create the directory if it doesn't exist
            console.log('Created "files" directory.');
        }

        try {
            // Navigate to the URL
            await page.goto(url, { waitUntil: 'networkidle' });
            console.log('Navigated to page.');

            // Debugging: Take a screenshot to verify the page content
            await page.screenshot({ path: path.join(filesDir, 'debug_screenshot.png') });
            

            // Debugging: Log the page content
            const pageContent = await page.content();
            console.log('Page content:', pageContent);

            // Wait for the #data element to be present
            try {
                await page.waitForSelector('#data', { timeout: 60000 });
                console.log('#data element is visible.');
            } catch (error) {
                console.warn('The #data element is not present on the page.');
                // Proceed with PDF generation even if #data is not found
            }

            // Additional wait for stability (optional)
            await page.waitForTimeout(3000);

            // Generate PDF
            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { bottom: 30, top: template == 1 ? 30 : 0 },
            });
            console.log('PDF generated successfully:', filePath);

            // Close the browser
            await browser.close();

            // Return the link to the generated PDF
            res.status(200).json({
                status: true,
                body: {
                    link: `https://cvtemplate.ekazi.co.tz/files/${fileName}`,
                },
            });
            console.log('PDF generation completed');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            await browser.close();
            res.status(500).send({
                status: false,
                message: 'Failed to generate PDF.',
                error: error.message,
            });
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send({
            status: false,
            message: 'Failed to generate PDF.',
            error: error.message,
        });
    }
});

app.listen(5001, () => {
    console.log('Server started at http://localhost:5001');
});