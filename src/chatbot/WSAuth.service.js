import jwt from "jsonwebtoken"
import { User } from "../models/users.model.js"

async function verifyUserWS(token) {
    if(!token) {
        throw new Error("Access Denied, No token is provided")
    }

    try {
        const currentUSer = jwt.verify(token, process.env.JWT_SECRET_KEY)

        const user = await User.findById(currentUSer.id)
        if(!user) {
            throw new Error("User not found")
        }
        if(user.activeSessionToken !== token) {
            throw new Error("Session expired or invalid. You have logged in from another device");
        }

        return user
        
    } catch (error) {
        if(error.name === "TokeExpiredError") {
            throw new Error("Token has expired. Please login again");
            
        } else if(error.name === "JsonWebTokenError") {
            throw new Error("Invalid token. Please login again");
            
        }else {
            throw error;
            
        }
    }
}

export default verifyUserWS;