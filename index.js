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
        const {id} = req.body;
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(`https://test.ekazi.co.tz/cv/template/${id}`);
        await page.pdf({ path: 'files/cv.pdf', format: 'A4',printBackground: true });
        await browser.close();
        res.status(200).json({
            status: true,
            body: {
                link: "https://cvtemplate.ekazi.co.tz/files/cv.pdf"
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: false,
            error
        });
    }
});

app.listen(5000, () => {
    console.log("Ekazi server started at 5000");
});
