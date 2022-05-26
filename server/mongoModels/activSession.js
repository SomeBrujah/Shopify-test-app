import mongoose from "mongoose";

const activeSessionSchema = new mongoose.Schema({
    shopUrl: String,
    sessionId: String,
    domainId: String,
    accessToken: String,
    state: String,
    isOnline: String,
    onlineAccessInfo: String,
    scope: String,
})

export const ActiveSessionModel = mongoose.model("activeSessions", activeSessionSchema);