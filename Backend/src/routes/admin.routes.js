import { Router } from "express"
import {
    getAllSOS,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    flagFalseAlert,
    getStats
} from "../controllers/admin.controller.js"
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js"

const adminRouter = Router()

// all admin routes need both middlewares
adminRouter.use(verifyJWT, verifyAdmin)

adminRouter.get("/stats", getStats)
adminRouter.get("/sos", getAllSOS)
adminRouter.get("/users", getAllUsers)
adminRouter.patch("/suspend/:userId", suspendUser)
adminRouter.patch("/unsuspend/:userId", unsuspendUser)
adminRouter.patch("/flag/:sosId", flagFalseAlert)

export default adminRouter