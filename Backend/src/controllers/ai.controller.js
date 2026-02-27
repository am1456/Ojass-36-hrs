import { GoogleGenerativeAI } from "@google/generative-ai"
import { SOS } from "../models/sos.model.js"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const getAIGuidance = async (req, res) => {
    try {
        const { sosId } = req.params

        const sos = await SOS.findById(sosId)
            .populate("triggeredBy", "name")

        if (!sos) return res.status(404).json({ message: "SOS not found" })

        // return cached guidance if already generated
        if (sos.aiGuidance) {
            return res.status(200).json({ 
                guidance: JSON.parse(sos.aiGuidance),
                cached: true
            })
        }

        const prompt = `
You are an emergency first responder assistant.
A ${sos.crisisType} emergency has been reported.

Give a response in this exact JSON format with no extra text, no markdown, no backticks:
{
    "immediateSteps": ["step 1", "step 2", "step 3"],
    "doNot": ["thing to avoid 1", "thing to avoid 2"],
    "emergencySummary": "A ready to read summary for emergency services in 2 sentences",
    "callNumbers": ["112", "108"]
}

Be concise, clear, and practical. This is a real emergency.
        `

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const rawText = result.response.text()

        // clean response in case gemini adds backticks
        const cleaned = rawText.replace(/```json|```/g, "").trim()
        const guidance = JSON.parse(cleaned)

        // cache it in DB so we don't call API again for same SOS
        sos.aiGuidance = JSON.stringify(guidance)
        await sos.save()

        return res.status(200).json({ guidance })

    } catch (error) {
        console.error("AI guidance error:", error)

        // fallback if AI fails
        const sos = await SOS.findById(req.params.sosId)
        const fallbackGuidance = getFallbackGuidance(sos?.crisisType || "Other")
        
        return res.status(200).json({ 
            guidance: fallbackGuidance,
            fallback: true 
        })
    }
}

const getFallbackGuidance = (crisisType) => {
    const fallbacks = {
        "Medical": {
            immediateSteps: [
                "Call 108 immediately",
                "Keep the person calm and still",
                "Check if they are breathing",
                "Do not give food or water"
            ],
            doNot: [
                "Do not move the person unless in danger",
                "Do not leave them alone"
            ],
            emergencySummary: "Medical emergency reported. Person needs immediate medical attention. Please send ambulance to location.",
            callNumbers: ["108", "112"]
        },
        "Fire": {
            immediateSteps: [
                "Call 101 immediately",
                "Evacuate the area",
                "Stay low if there is smoke",
                "Do not use elevators"
            ],
            doNot: [
                "Do not go back inside",
                "Do not use water on electrical fires"
            ],
            emergencySummary: "Fire emergency reported. Immediate fire service response required at location.",
            callNumbers: ["101", "112"]
        },
        "Breakdown": {
            immediateSteps: [
                "Move vehicle to safe location",
                "Turn on hazard lights",
                "Stay away from traffic",
                "Call roadside assistance"
            ],
            doNot: [
                "Do not stand behind the vehicle",
                "Do not leave children in the car"
            ],
            emergencySummary: "Vehicle breakdown reported. Roadside assistance needed at location.",
            callNumbers: ["112"]
        },
        "Gas Leak": {
            immediateSteps: [
                "Evacuate immediately",
                "Do not turn on any switches",
                "Call 101 fire service",
                "Open windows if safe to do so"
            ],
            doNot: [
                "Do not use any electrical switches",
                "Do not smoke or use open flames",
                "Do not use elevator"
            ],
            emergencySummary: "Gas leak reported. Immediate fire service response required. Area being evacuated.",
            callNumbers: ["101", "112"]
        },
        "Other": {
            immediateSteps: [
                "Call 112 for general emergency",
                "Stay calm",
                "Stay at your location",
                "Help is on the way"
            ],
            doNot: [
                "Do not panic",
                "Do not leave the area"
            ],
            emergencySummary: "Emergency reported. Immediate assistance required at location.",
            callNumbers: ["112"]
        }
    }

    return fallbacks[crisisType] || fallbacks["Other"]
}

export { getAIGuidance }