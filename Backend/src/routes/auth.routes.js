import { Router } from "express"
import { register, login, logout, refresh } from "../controllers/auth.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const authrouter = Router()

authrouter.post("/register", register)
authrouter.post("/login", login)
authrouter.post("/logout", verifyJWT, logout)
authrouter.post("/refresh", refresh)

export default authrouter