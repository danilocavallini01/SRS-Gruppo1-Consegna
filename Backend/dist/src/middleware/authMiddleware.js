"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenVerification = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret'; // Replace with env in prod
const tokenVerification = function verifyToken(req, res, next) {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    console.log('Cookies:', req.cookies); // Log cookies for debugging
    if (!token) {
        res.status(401).json({ error: 'Authentication token not found' });
        console.error('Authentication token not found');
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    }
    catch (err) {
        console.error('Token verification failed:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
};
exports.tokenVerification = tokenVerification;
