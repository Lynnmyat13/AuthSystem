import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenManager";

interface AuthRequest extends Request {
    user?: any;
    userId?: string;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Verify token from database
        const tokenData = await verifyAccessToken(token);

        req.user = tokenData.user;
        req.userId = tokenData.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
