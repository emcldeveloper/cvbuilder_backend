const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
const { chromium } = require('playwright');

app.use(cors());
app.use(express.json());
app.use("/files", express.static("files"));
app.use(bodyParser.text({ type: "/" }));

app.get("/generatePdf", async (req, res) => {
    try {
        const { uuid, template, name } = req.query;
        const url = `https://cvbuilder.ekazi.co.tz/template${template}/${uuid}`;
        console.log(`Navigating to: ${url}`);

        const browser = await chromium.launch();
        const page = await browser.newPage();

        await page.goto(url);
        const isDataPresent = await page.evaluate(() => !!document.querySelector('#data'));
        if (!isDataPresent) {
            
            throw new Error('The #data element is not present on the page .');
        }

        await page.waitForSelector('#data', { timeout: 60000 });
        const filePath = `files/${name} CV.pdf`;
        await page.pdf({ path: filePath, format: 'A4', printBackground: true });
        await browser.close();

        res.status(200).json({ status: true, body: { link: `https://cvtemplate.ekazi.co.tz/${filePath}` } });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ status: false, message: 'Failed to generate PDF', error: error.message });
    }
});


app.listen(6000, () => {
    console.log("Ekazi server started at 6000");
});
