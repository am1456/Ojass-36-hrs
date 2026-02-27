import jwt from "jsonwebtoken"
import { User } from "../models/User.model.js"

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken 
            || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" })
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decoded._id).select("-password -refreshToken")

        if (!user) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" })
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account suspended" })
        }

        req.user = user
        next()

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" })
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" })
        }
        return res.status(500).json({ message: "Internal server error" })
    }
}

const verifyAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admins only" })
    }
    next()
}

export { verifyJWT, verifyAdmin }