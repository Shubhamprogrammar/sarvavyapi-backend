const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const { OAuth2Client } = require('google-auth-library');
const authoriseuser = require('../middleware/authoriseuser');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Initialize OAuth2Client
const client = new OAuth2Client(CLIENT_ID);

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Profile/'); // Ensure Profile directory exists
    },
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/\s+/g, '_'); // Remove spaces
        cb(null, `${Date.now()}_${sanitizedFilename}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extname && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
});

// Signup Route
router.post(
    '/signup',
    upload.single('photo'),
    [
        body('name', 'Enter a valid name').isLength({ min: 3 }),
        body('email', 'Enter a valid email').isEmail(),
        body('contact', 'Enter a valid mobile number').isLength({ min: 10 }),
        body('address', 'Proper address must be given').isLength({ min: 5 }),
        body('password', 'Password must be at least 8 characters long').isLength({ min: 8 }),
    ],
    async (req, res) => {
        let success = false;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ msg: 'User with this email already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const secPassword = await bcrypt.hash(req.body.password, salt);

            // Ensure correct path format
            const photoPath = req.file ? `/Profile/${req.file.filename}` : null;

            user = await User.create({
                photo: photoPath,
                name: req.body.name,
                email: req.body.email,
                contact: req.body.contact,
                address: req.body.address,
                password: secPassword,
            });

            const data = {
                user: {
                    id: user.id,
                    name: user.name,
                },
            };
            success = true;

            const authToken = jwt.sign(data, JWT_SECRET);
            res.json({ success, authToken, userId: user.id });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Internal Server Error Occurred');
        }
    }
);

// Login Route
router.post('/login', [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists()
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: "Please try to login with correct credentials" });
        }

        const passwordCompare = await bcrypt.compare(req.body.password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        const data = {
            user: {
                id: user.id,
                name: user.name,
            }
        };
        success = true;

        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({ success, authToken, userId: user.id });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server Error Occurred");
    }
});

router.post('/google-login', async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ success: false, message: "No token provided" });
        }
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        const { name, email, picture } = ticket.getPayload();

        // Check if user exists in the database
        let user = await User.findOne({ email });

        if (!user) {
            // Register new user if not found
            user = new User({
                photo: picture,  // Store Google profile picture
                name,
                email,
                contact: "",
                address: "",
                password: "",
            });

            await user.save();
        }

        // Generate JWT token
        const data = { user: { id: user.id, name: user.name } };
        const authToken = jwt.sign(data, JWT_SECRET);

        res.json({ success: true, authToken, userId: user.id });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(400).json({ success: false, message: 'Google login failed', error: error.message });
    }
});

// Fetch User Profile Route
router.get('/profile',authoriseuser, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/profile/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid user ID format." });
        }

        const userProfile = await User.findById(id).select("name email contact address");

        if (!userProfile) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json(userProfile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Fetch user profile based on query
router.get("/profileq", async (req, res) => {
    try {
        const { user } = req.query;

        if (!user || !mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ error: "Invalid user ID format." });
        }

        const userProfile = await User.findById(user).select("-password");

        if (!userProfile) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json(userProfile);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Update Profile Route
router.put("/update-profile", authoriseuser, upload.single("profileImage"), async (req, res) => {
    try {
        const { name, email, contact, address } = req.body;
        const updatedData = { name, email, contact, address };

        if (req.file) {
            updatedData.photo = `/Profile/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true }).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating profile" });
    }
});

router.post("/change-password", async (req, res) => {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    try {
        if (!email || !currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
