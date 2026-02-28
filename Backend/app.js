import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:5173", "http://localhost:5174"]

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        // Allow exact matches OR any *.vercel.app subdomain (for preview deployments too)
        const allowed = allowedOrigins.includes(origin) ||
            /\.vercel\.app$/.test(origin)
        if (allowed) {
            callback(null, true)
        } else {
            callback(new Error(`CORS: ${origin} not allowed`))
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())



import authrouter from "./src/routes/auth.routes.js"
import adminRouter from "./src/routes/admin.routes.js"
import sosRouter from "./src/routes/sos.routes.js"
import aiRouter from "./src/routes/ai.routes.js"

app.use("/api/ai", aiRouter)
app.use("/api/v1/auth", authrouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/sos", sosRouter)

// Health check — used by Render to verify the service is alive
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date() }))

export { app };