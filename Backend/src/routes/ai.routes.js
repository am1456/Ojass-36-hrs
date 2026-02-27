import { Router } from "express"
import { getAIGuidance } from "../controllers/ai.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.get("/guidance/:sosId", getAIGuidance)

export default router