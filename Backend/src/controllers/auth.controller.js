import { User } from "../models/User.model.js"
import { generateTokens } from "../utilities/generateToken.js"

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // In production (Vercel + Render = different domains) must be 'none' with secure:true
    // In development (same localhost origin) use 'strict'
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
}

// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password, skills } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({ message: "Email already in use" })
        }

        const user = await User.create({ name, email, password, skills })

        const { accessToken, refreshToken } = await generateTokens(user)

        return res.status(201)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                message: "User registered successfully",
                accessToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    skills: user.skills,
                    isAdmin: user.isAdmin
                }
            })

    } catch (error) {
        console.error("Register error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account suspended" })
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const { accessToken, refreshToken } = await generateTokens(user)

        return res.status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                message: "Login successful",
                accessToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    skills: user.skills,
                    isAdmin: user.isAdmin
                }
            })

    } catch (error) {
        console.error("Login error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// LOGOUT
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            refreshToken: ""
        })

        return res.status(200)
            .clearCookie("refreshToken", cookieOptions)
            .json({ message: "Logged out successfully" })

    } catch (error) {
        console.error("Logout error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// REFRESH TOKEN
const refresh = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decoded._id)

        if (!user || user.refreshToken !== incomingRefreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" })
        }

        const { accessToken, refreshToken } = await generateTokens(user)

        return res.status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                accessToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    skills: user.skills,
                    isAdmin: user.isAdmin
                }
            })

    } catch (error) {
        console.error("Refresh error:", error)
        return res.status(401).json({ message: "Invalid or expired refresh token" })
    }
}

export { register, login, logout, refresh }