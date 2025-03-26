const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require('express-validator');
const Admin = require("../models/Admin");
const dotenv = require("dotenv");
const adminauthorise = require("../middleware/adminauthorise");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Register Admin (Only run once to create admin)
router.post(
    "/register",
    [
        check("username", "Username is required").not().isEmpty(),
        check("passkey", "Passkey must be at least 6 characters long").isLength({ min: 6 }),
    ],
    async (req, res) => {
        let success = false;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            let user = await Admin.findOne({ username: req.body.username });
            if (user) {
                return res.status(400).json({ msg: "User with this username already exists" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.passkey, salt); 

            user = await Admin.create({
                username: req.body.username,
                passkey: hashedPassword, 
            });

            const data = {
                user: {
                    id: user.id,
                    username: user.username, 
                },
            };
            success = true;

            const authToken = jwt.sign(data, JWT_SECRET, { expiresIn: "1h" });
            return res.json({ success, authToken, userId: user.id }); 
        } catch (error) {
            console.error("Error in /register:", error.message);
            return res.status(500).json({ error: "Internal Server Error Occurred" }); 
        }
    }
);

// Admin Login
router.post("/admin-login", async (req, res) => {
    const { username, passkey } = req.body; 
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ error: "Admin not found" }); 
        }

        const isMatch = await bcrypt.compare(passkey, admin.passkey); 
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" }); 
        }

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "1h" });
        return res.json({success:true, token }); 
    } catch (err) {
        return res.status(500).json({ error: err.message }); 
    }
});

// Admin Dashboard
router.get("/dashboard", adminauthorise, async (req, res) => {
    try {
        const users = await Admin.find().select("-passkey"); 
        if (!users || users.length === 0) { 
            return res.status(404).json({ message: "No admins found" }); 
        }
        return res.json(users); 
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: "Internal Server Error" }); 
    }
});

router.delete("/remove/:adminId", adminauthorise, async (req, res) => {
    try {
        const { adminId } = req.params;
        const removedAdmin = await Admin.findByIdAndDelete(adminId);

        if (!removedAdmin) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        res.json({ success: true, message: "Admin removed successfully." });
    } catch (error) {
        console.error("Error removing admin:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

module.exports = router;
