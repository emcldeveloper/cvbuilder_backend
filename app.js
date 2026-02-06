import express from "express";
import cors from "cors";

import pdfRoutes from "./src/routes/pdf.routes.js";
import fileRoutes from "./src/routes/file.routes.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import { PORT } from "./src/config/env.js";

const app = express();

const allowedOrigins = ["http://localhost:3000", "https://ekazi.co.tz"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// API Endpoints
app.use("/api/generatePdf", pdfRoutes);
app.use("/api/files", fileRoutes);

app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`✅ PDF Server running on http://localhost:${PORT}`);
});
