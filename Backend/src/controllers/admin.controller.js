import { SOS } from "../models/sos.model.js"
import { User } from "../models/User.model.js"

// GET ALL SOS (active + resolved)
const getAllSOS = async (req, res) => {
    try {
        const sosList = await SOS.find()
            .populate("triggeredBy", "name email trustScore")
            .populate("responders.user", "name email")
            .sort({ createdAt: -1 })

        return res.status(200).json({ sosList })

    } catch (error) {
        console.error("Get all SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// GET ALL USERS
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password -refreshToken")
            .sort({ createdAt: -1 })

        return res.status(200).json({ users })

    } catch (error) {
        console.error("Get all users error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// SUSPEND USER
const suspendUser = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" })

        if (user.isAdmin) {
            return res.status(403).json({ message: "Cannot suspend an admin" })
        }

        user.isSuspended = true
        await user.save()

        return res.status(200).json({ message: `${user.name} suspended successfully` })

    } catch (error) {
        console.error("Suspend user error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// UNSUSPEND USER
const unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" })

        user.isSuspended = false
        user.falseAlertCount = 0
        await user.save()

        return res.status(200).json({ message: `${user.name} unsuspended successfully` })

    } catch (error) {
        console.error("Unsuspend user error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// FLAG SOS AS FALSE ALERT
const flagFalseAlert = async (req, res) => {
    try {
        const { sosId } = req.params

        const sos = await SOS.findById(sosId)
        if (!sos) return res.status(404).json({ message: "SOS not found" })

        const user = await User.findById(sos.triggeredBy)
        if (!user) return res.status(404).json({ message: "User not found" })

        // penalise trust score
        user.trustScore = Math.max(0, user.trustScore - 20)
        user.falseAlertCount += 1

        // auto suspend after 3 false alerts
        if (user.falseAlertCount >= 3) {
            user.isSuspended = true
        }

        await user.save()

        return res.status(200).json({
            message: "False alert flagged",
            suspended: user.isSuspended,
            trustScore: user.trustScore,
            falseAlertCount: user.falseAlertCount
        })

    } catch (error) {
        console.error("Flag false alert error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// DASHBOARD STATS
const getStats = async (req, res) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
            totalSOS,
            activeSOS,
            resolvedSOS,
            todaySOS,
            totalUsers,
            suspendedUsers
        ] = await Promise.all([
            SOS.countDocuments(),
            SOS.countDocuments({ status: "active" }),
            SOS.countDocuments({ status: "resolved" }),
            SOS.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments(),
            User.countDocuments({ isSuspended: true })
        ])

        return res.status(200).json({
            totalSOS,
            activeSOS,
            resolvedSOS,
            todaySOS,
            totalUsers,
            suspendedUsers
        })

    } catch (error) {
        console.error("Get stats error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export { getAllSOS, getAllUsers, suspendUser, unsuspendUser, flagFalseAlert, getStats }