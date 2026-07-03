"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const tokenManager_1 = require("../utils/tokenManager");
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }
        // Verify token from database
        const tokenData = await (0, tokenManager_1.verifyAccessToken)(token);
        req.user = tokenData.user;
        req.userId = tokenData.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.verifyToken = verifyToken;
