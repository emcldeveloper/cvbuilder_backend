const express = require('express')
const app = express();
const puppeteer = require('puppeteer');
const bodyParser = require("body-parser");

const cors = require('cors')
app.use(cors()); 
app.use(express.json());
app.use("/files",express.static("files"));
app.use(bodyParser.text({ type: "/" }));




app.post("/generatePdf",async(req,res)=>{
    try {
        const {id} = req.body;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`https://test.ekazi.co.tz/cv/template/${id}`);
        await page.pdf({ path: 'files/cv.pdf', printBackground:true, format: 'A4'});
        await browser.close();
        res.status(200).json({
            status:true,
            body:{
                link:"http://localhost:5000/files/cv.pdf"
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            status:false,
            error
        })
    }
})


app.get('/',async(req,res)=>{
    try {
      res.status(200).json({
        status:true,
        body:{
            message:"Server is working fine"
        }
      })
    } catch (error) {
        
    }
})

app.listen(5000,()=>{
  console.log("Ekazi server started at 5000")
})