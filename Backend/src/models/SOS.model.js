import mongoose from "mongoose";

const sosSchema = new mongoose.Schema({
    crisisType: {
        type: String,
        enum: ["Medical", "Fire", "Breakdown", "Gas Leak", "Other"],
        required: true
    },
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],   // [longitude, latitude]
            required: true
        }
    },
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    radius: {
        type: Number,
        enum: [500, 1000, 2000],
        default: 1000
    },
    status: {
        type: String,
        enum: ["active", "resolved"],
        default: "active"
    },
    responders: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["on the way", "arrived"], default: "on the way" },
        respondedAt: { type: Date, default: Date.now }
    }],
    aiGuidance: {
        type: String,
        default: ""
    },
    messages: [{
        from: { type: String, required: true },
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true })

sosSchema.index({ location: "2dsphere" })

export const SOS = mongoose.model("SOS", sosSchema)