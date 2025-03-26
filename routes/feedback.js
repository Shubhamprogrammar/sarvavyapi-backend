const express = require("express")
const router = express.Router();
const { validationResult } = require('express-validator');
const Feed = require('../models/Feedback');

router.post('/addfeedback',
    async (req,res)=>{
        try {
            const { name, email,feedback } = req.body;
            // If there are errors , return bad request and the errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const feed = new Feed({
                name, email, feedback
            });
            
            const savedFeed = await feed.save();
            res.json({ savedFeed });
        }
        catch (error) {
            console.log(error.message);
            res.status(500).send("Internal server Error Occured")
        }
    }
)

module.exports = router;