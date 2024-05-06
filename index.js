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
       const {uuid,template} = req.query;
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(`http://cvbuilder.ekazi.co.tz/template${template}/${uuid}`);
        await page.waitForSelector('#data');
        await page.waitForTimeout(3000)

        await page.pdf({ path: 'files/cv.pdf', format: 'A4',printBackground: true,preferCSSPageSize:true,outline:true,margin:{bottom:30,top:template==1?30:0} });
        await browser.close();
        res.status(200).json({
            status: true,
            body: {
                link: "http://cvtemplate.ekazi.co.tz/files/cv.pdf"
            }
        });
        console.log('Completed')
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
