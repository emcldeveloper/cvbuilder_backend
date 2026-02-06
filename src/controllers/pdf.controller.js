import { createPdf } from "../services/pdf.service.js";

export const generatePdf = async (req, res) => {
  try {
    const result = await createPdf(req.query);
    res.status(200).json({ status: true, body: result });
  } catch (error) {
    console.error("PDF CONTROLLER ERROR:", error);
    res.status(500).json({
      status: false,
      message: error.message || "PDF generation failed",
    });
  }
};
