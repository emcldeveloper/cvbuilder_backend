const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
const { chromium } = require('playwright');




///app.use(cors());
app.use(cors({
    origin: 'https://cvbuilder.ekazi.co.tz',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
app.use(express.json());
app.use("/files", express.static("files"));
app.use(bodyParser.text({ type: "/" }));


app.get("/generatePdf", async (req, res) => {
   
    
    try {
      
       ///
        const { uuid, template, name } = req.query;
        
        // Check for #data
        const singleTemplate = Array.isArray(template) ? template[0] : template;
        const singleId = Array.isArray(uuid) ? uuid[0] : uuid;

        // Log for debugging
      


        if (!uuid || !template || !name) {
            return res.status(400).send({
                status: false,
                message: 'Missing required query parameters: uuid, template, or name.',
            });
        }


        const browser = await chromium.launch();
        const page = await browser.newPage();
       
            // await page.goto(`http://localhost:3000/template${template}/${uuid}`);
            // console.log("Navigated to page.");
        
            // await page.waitForSelector('#data', { timeout: 60000 });
            // console.log("#data element is visible.");
        
            // await page.waitForTimeout(6000); // Additional wait if needed
        
            // const filePath = `files/${name} CV.pdf`;
            // await page.pdf({
            //     path: filePath,
            //     format: 'A4',
            //     printBackground: true,
            //     preferCSSPageSize: true,
            //     margin: { bottom: 30, top: template == 1 ? 30 : 0 },
            // });
            // console.log("PDF generated successfully:", filePath);
            // await browser.close();
            const filePath = `files/${name}CV.pdf`;
            try {
                const url = `https://cvbuilder.ekazi.co.tz/template${singleTemplate}/${singleId}`;
                console.log("Constructed URL:", url);

                await page.goto(url);
                
            

        const dataElement = await page.$('#data');
        if (!dataElement) {
            console.warn("The #data element is not present on the page.");
            // Optionally, proceed with PDF generation without #data
        } else {
            console.log("The #data element is present.");
        }
                console.log("Navigated to page.");
                await page.waitForSelector('#data');
                await page.waitForTimeout(3000)
              
                // Debugging: Check for #data element
            if (!(await page.$('#data'))) {
                console.error("The #data element is not present on the page.");
                await browser.close();
                return res.status(500).json({
                    status: false,
                    message: "Failed to generate PDF: The #data element is not present on the page.",
                });
            }
            
                
                
                // await page.waitForTimeout(6000); // Additional wait if needed
            
               
                await page.pdf({
                    path: filePath,
                    format: 'A4',
                    printBackground: true,
                    preferCSSPageSize: true,
                    margin: { bottom: 30, top: template == 1 ? 30 : 0 },
                });
                console.log("PDF generated successfully:", filePath);
                await browser.close();
            } catch (error) {
                console.error("Failed to generate PDF:", error);
                await browser.close();
            }
            
        


        res.status(200).json({
            status: true,
            body: {
                link: `https://cvtemplate.ekazi.co.tz/${filePath}`,
                // https://cvtemplate.ekazi.co.tz/${filePath}
            },
        });
        console.log('PDF generation completed');
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send({
            status: false,
            message: 'Failed to generate PDF.',
            error: error.message,
        });
    }
});




app.listen(4000, () => {
    console.log("Ekazi server started at 4000");
});



