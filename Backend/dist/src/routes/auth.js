"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../../secrets"); // Ensure you have JWT_SECRET defined in your secrets file
const router = express_1.default.Router();
router.get("/google", passport_1.default.authenticate("google", {
    scope: ["email", "profile"],
}));
/*router.get("/google/redirect", passport.authenticate("google"), (req, res)=> {
  console.log("callback")
  const user: any = req.user; // Assuming req.user contains the user information
  if (!user || !user.id || !user.email) {
    res.status(401).send("User not authenticated");
    return;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" } // Token expiration time
  );
 // Assuming req.user contains the user information
  console.log("User authenticated:");
  res.redirect("http://localhost:5173?token=" + token); // Redirect to your frontend app

}); */
router.get("/google/redirect", (req, res, next) => {
    passport_1.default.authenticate("google", (err, user, info) => {
        if (err || !user) {
            return res.status(401).send("Authentication failed");
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, secrets_1.JWT_SECRET, { expiresIn: "3h" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Set to true in production (requires HTTPS)
            maxAge: 1 * 60 * 60 * 1000 // 3 hours
        });
        // Redirect with token
        res.redirect(`http://localhost:5173?token=${token}`);
    })(req, res, next);
});
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
exports.default = router;
