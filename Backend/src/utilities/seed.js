import mongoose from "mongoose"
import { User } from "../models/User.model.js"
import dotenv from "dotenv"
dotenv.config({ path: "./.env" })

const seedAdmin = async () => {
    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)

    const existing = await User.findOne({ email: "admin@nearhelp.com" })
    if (existing) {
        console.log("Admin already exists")
        process.exit(0)
    }

    await User.create({
        name: "Admin",
        email: "admin@nearhelp.com",
        password: "admin123",
        isAdmin: true
    })

    console.log("Admin created successfully")
    console.log("Email: admin@nearhelp.com")
    console.log("Password: admin123")
    process.exit(0)
}

seedAdmin()