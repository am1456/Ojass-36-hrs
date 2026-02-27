import { Router } from "express"
import { 
    triggerSOS, 
    respondToSOS, 
    resolveSOS, 
    getActiveSOSList,
    getSOSById,
    updateResponderStatus
} from "../controllers/sos.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const sosRouter = Router()

// all routes protected
sosRouter.use(verifyJWT)

sosRouter.get("/active", getActiveSOSList)
sosRouter.get("/:sosId", getSOSById)
sosRouter.post("/trigger", triggerSOS)
sosRouter.post("/respond/:sosId", respondToSOS)
sosRouter.patch("/resolve/:sosId", resolveSOS)
sosRouter.patch("/status/:sosId", updateResponderStatus)

export default sosRouter