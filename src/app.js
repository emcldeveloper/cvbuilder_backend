import express from "express";
import cors from "cors";
import pdfRoutes from "./routes/pdf.routes.js";

const app = express();

// Middleware
app.use(cors({ origin: ["http://localhost:3000", "https://www.ekazi.com"] }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/pdf", pdfRoutes);

export default app;
