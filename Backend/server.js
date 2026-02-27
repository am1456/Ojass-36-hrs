import dotenv from "dotenv"
import connectDB from "./src/db/index.js"
import { app } from "./app.js";
import sosHandler from "./src/socket/sosHandler.js"


dotenv.config({
    path: './.env'
})

sosHandler(io)
app.set("io", io)

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`)
        })
    })
    .catch((error) => {
        console.error("MONOGO DB connection failed !!", error)
    })
