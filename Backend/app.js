import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import aiRouter from "./src/routes/ai.routes.js"


const app = express();

const allowedOrigins = [
    "http://localhost:5173"
];

app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);

        if(allowedOrigins.indexOf(origin) !== -1){
            callback(null, true);
        }
        else{
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())                              
app.use(express.urlencoded({ extended: true }))  
app.use(cookieParser())
app.use("/api/ai", aiRouter)


import authrouter from "./src/routes/auth.routes.js"
import sosRouter from "./src/routes/sos.routes.js"


app.use("/api/v1/auth", authrouter)
app.use("api/v1/sos", sosRouter)



export {app};