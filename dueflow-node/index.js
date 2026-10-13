require("dotenv").config();
const express = require("express");
const cors = require("cors");

const db = require("./db/db-connection")


const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.locals.db = db;
app.use("/api/organizations", require("./routes/organizationRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/compliance-rules", require("./routes/complianceRuleRoutes"));
app.use("/api/ledger-imports", require("./routes/ledgerImportRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/agent-runs", require("./routes/agentRunRoutes"));
app.use("/api/agent-steps", require("./routes/agentStepRoutes"));
app.use("/api/payment-plans", require("./routes/paymentPlanRoutes"));
app.use("/api/plan-items", require("./routes/planItemRoutes"));
app.use("/api/approvals", require("./routes/approvalRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/vendor-notices", require("./routes/vendorNoticeRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/agent-memory", require("./routes/agentMemoryRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));


const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`✅ Database connected`);
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Unable to connect to DB:", error);
  }
})
