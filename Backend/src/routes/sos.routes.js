import { Router } from "express"
import {
    triggerSOS,
    respondToSOS,
    resolveSOS,
    getActiveSOSList,
    getSOSById,
    updateResponderStatus,
    updateLocation,
    getChatMessages
} from "../controllers/sos.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const sosRouter = Router()

// all routes protected
sosRouter.use(verifyJWT)

sosRouter.get("/active", getActiveSOSList)
sosRouter.get("/:sosId/messages", getChatMessages)   // ← chat history
sosRouter.get("/:sosId", getSOSById)
sosRouter.post("/trigger", triggerSOS)
sosRouter.post("/respond/:sosId", respondToSOS)
sosRouter.patch("/resolve/:sosId", resolveSOS)
sosRouter.patch("/status/:sosId", updateResponderStatus)
sosRouter.patch("/location", updateLocation)   // ← sync user location on map load

export default sosRouter