import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import connectDB from "./src/db/index.js"
import { app } from "./app.js"
import sosHandler from "./src/socket/sosHandler.js"

dotenv.config({
    path: './.env'
})

// create http server from express app
const httpServer = createServer(app)

// create socket.io instance
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
})

// attach io to app so controllers can access it
app.set("io", io)

// register socket handlers
sosHandler(io)

connectDB()
    .then(() => {
        httpServer.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`)
        })
    })
    .catch((error) => {
        console.error("MONGODB connection failed !!", error)
    })