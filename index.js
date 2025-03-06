const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

app.use(express.json());
app.use('/files', express.static('files')); // Serve static files from the "files" directory
app.use(bodyParser.text({ type: '/' }));

// Function to sanitize file names
const sanitize = (str) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
 
// CORS Configuration
app.use(cors({
    origin: 'https://cvbuilder.ekazi.co.tz', // Allow only this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow cookies and credentials (if needed)
}));

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