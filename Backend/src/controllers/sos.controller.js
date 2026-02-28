import { SOS } from "../models/SOS.model.js"
import { User } from "../models/User.model.js"
import { findNearbyUsers } from "../utilities/geoQuery.js"

// TRIGGER SOS
const triggerSOS = async (req, res) => {
    try {
        const { crisisType, lat, lng, radius } = req.body

        if (!crisisType || !lat || !lng) {
            return res.status(400).json({ message: "Crisis type and location required" })
        }

        const sos = await SOS.create({
            crisisType,
            location: {
                type: "Point",
                coordinates: [lng, lat]
            },
            triggeredBy: req.user._id,
            radius: radius || 1000
        })

        // find nearby users within radius
        const nearbyUsers = await findNearbyUsers(
            User,
            lng,
            lat,
            radius || 1000,
            req.user._id
        )

        // emit socket event to nearby users
        const io = req.app.get("io")
        nearbyUsers.forEach(user => {
            io.to(user._id.toString()).emit("sos:new", {
                sosId: sos._id,
                crisisType: sos.crisisType,
                location: { lat, lng },
                triggeredBy: {
                    _id: req.user._id,
                    name: req.user.name
                },
                radius: sos.radius
            })
        })

        return res.status(201).json({
            message: "SOS triggered successfully",
            sos
        })

    } catch (error) {
        console.error("Trigger SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// RESPOND TO SOS
const respondToSOS = async (req, res) => {
    try {
        const { sosId } = req.params
        const { lat, lng } = req.body

        if (!lat || !lng) {
            return res.status(400).json({ message: "Location required" })
        }

        const sos = await SOS.findById(sosId)
        if (!sos) return res.status(404).json({ message: "SOS not found" })
        if (sos.status === "resolved") {
            return res.status(400).json({ message: "SOS already resolved" })
        }

        // check if already responding
        const alreadyResponding = sos.responders.find(
            r => r.user.toString() === req.user._id.toString()
        )
        if (alreadyResponding) {
            return res.status(400).json({ message: "Already responding" })
        }

        sos.responders.push({
            user: req.user._id,
            status: "on the way"
        })
        await sos.save()

        // update responder's location
        await User.findByIdAndUpdate(req.user._id, {
            location: {
                type: "Point",
                coordinates: [lng, lat]
            }
        })

        // notify SOS triggerer via socket
        const io = req.app.get("io")
        io.to(sos.triggeredBy.toString()).emit("responder:joined", {
            sosId,
            responder: {
                _id: req.user._id,
                name: req.user.name,
                skills: req.user.skills,
                trustScore: req.user.trustScore,
                location: { lat, lng }
            }
        })

        // update trust score
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { trustScore: 2 }
        })

        return res.status(200).json({ message: "Responding to SOS" })

    } catch (error) {
        console.error("Respond SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// RESOLVE SOS
const resolveSOS = async (req, res) => {
    try {
        const { sosId } = req.params

        const sos = await SOS.findById(sosId)
        if (!sos) return res.status(404).json({ message: "SOS not found" })

        if (sos.triggeredBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the person who triggered can resolve" })
        }

        if (sos.status === "resolved") {
            return res.status(400).json({ message: "SOS already resolved" })
        }

        sos.status = "resolved"
        await sos.save()

        // boost trust score of triggerer
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { trustScore: 5 }
        })

        // notify everyone
        const io = req.app.get("io")
        io.emit("sos:resolved", { sosId })

        return res.status(200).json({ message: "SOS resolved successfully" })

    } catch (error) {
        console.error("Resolve SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// GET ALL ACTIVE SOS (for map load on page open)
const getActiveSOSList = async (req, res) => {
    try {
        const activeList = await SOS.find({ status: "active" })
            .populate("triggeredBy", "name email")
            .sort({ createdAt: -1 })

        return res.status(200).json({ activeList })

    } catch (error) {
        console.error("Get active SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// GET SINGLE SOS DETAILS
const getSOSById = async (req, res) => {
    try {
        const sos = await SOS.findById(req.params.sosId)
            .populate("triggeredBy", "name email skills trustScore")
            .populate("responders.user", "name skills trustScore")

        if (!sos) return res.status(404).json({ message: "SOS not found" })

        return res.status(200).json({ sos })

    } catch (error) {
        console.error("Get SOS error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// UPDATE RESPONDER STATUS (on the way → arrived)
const updateResponderStatus = async (req, res) => {
    try {
        const { sosId } = req.params
        const { status } = req.body

        if (!["on the way", "arrived"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" })
        }

        const sos = await SOS.findById(sosId)
        if (!sos) return res.status(404).json({ message: "SOS not found" })

        const responder = sos.responders.find(
            r => r.user.toString() === req.user._id.toString()
        )

        if (!responder) {
            return res.status(404).json({ message: "You are not a responder for this SOS" })
        }

        responder.status = status
        await sos.save()

        // notify triggerer
        const io = req.app.get("io")
        io.to(sos.triggeredBy.toString()).emit("responder:statusUpdate", {
            sosId,
            responderId: req.user._id,
            status
        })

        return res.status(200).json({ message: `Status updated to ${status}` })

    } catch (error) {
        console.error("Update responder status error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// GET CHAT MESSAGES for an SOS room
const getChatMessages = async (req, res) => {
    try {
        const sos = await SOS.findById(req.params.sosId).select("messages")
        if (!sos) return res.status(404).json({ message: "SOS not found" })
        return res.status(200).json({ messages: sos.messages })
    } catch (error) {
        console.error("Get chat messages error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// UPDATE USER LOCATION (called when the map loads — keeps $nearSphere accurate)
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body
        if (lat == null || lng == null) {
            return res.status(400).json({ message: "lat and lng are required" })
        }
        await User.findByIdAndUpdate(req.user._id, {
            location: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        })
        res.json({ message: "Location updated" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export {
    triggerSOS,
    respondToSOS,
    resolveSOS,
    getActiveSOSList,
    getSOSById,
    updateResponderStatus,
    updateLocation,
    getChatMessages
}