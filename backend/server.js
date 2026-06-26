import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import Routes
import authRoutes from "./src/routes/authRoutes.js";
import cargoRoutes from "./src/routes/cargoRoutes.js";
import shipmentRoutes from "./src/routes/shipmentRoutes.js";
import warehouseRoutes from "./src/routes/warehouseRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import themeRoutes from "./src/routes/themeRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

// Import Middleware
import { errorHandler } from "./src/middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: "*", // Adjust in production to frontend domain
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoints Mapping
app.use("/api/auth", authRoutes);
app.use("/api/cargo", cargoRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", themeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Catch-all route handler
app.use((req, res, next) => {
  res.status(404).json({ error: "API route not found" });
});

// Exception handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  CARGO INVENTORY SYSTEM BACKEND RUNNING ON PORT ${PORT} `);
  console.log(`  http://localhost:${PORT}                            `);
  console.log(`====================================================`);
});
