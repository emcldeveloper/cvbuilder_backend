import express from "express";
import cors from "cors";

import pdfRoutes from "./src/routes/pdf.routes.js";
import fileRoutes from "./src/routes/file.routes.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import { PORT } from "./src/config/env.js";

const app = express();

app.use(express.json());

// API Endpoints
app.use("/api/generatePdf", pdfRoutes);
app.use("/api/files", fileRoutes);

app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`✅ PDF Server running on http://localhost:${PORT}`);
});
