const express = require('express');
const path = require('path');
const router = express.Router();
const { validationResult } = require('express-validator');
const authoriseuser = require('../middleware/authoriseuser');
const multer = require('multer');
const Property = require('../models/Property');
const City = require("../models/City")

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Property/'); // Folder where images will be saved
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid name conflicts
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

router.post('/addproperty', upload.single('image'), authoriseuser, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, type, categories, size, address, city, condition } = req.body;

        // Validate required fields
        if (!name || !type || !categories || !size || !address || !city || !condition) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Property image is required" });
        }

        const photoPath = `${req.protocol}://${req.get('host')}/Property/${req.file.filename}`;

        const property = new Property({
            user: req.user.id,
            image: photoPath,
            name,
            type,
            categories,
            size,
            address,
            city,
            condition,
            approved: false
        });

        const savedProperty = await property.save();
        res.json({ savedProperty });
    } catch (error) {
        console.error("Error in addProperty:", error);
        res.status(500).json({ error: "Internal Server Error Occurred", details: error.message });
    }
});

router.put('/updateproperty/:id', authoriseuser,
    async (req, res) => {
        try {
            const { name, type, categories, size, address, condition } = req.body;
            // Create a new Note object
            const newProperty = {};
            if (name) { newProperty.name = name }
            if (type) { newProperty.type = type }
            if (categories) { newProperty.categories = categories }
            if (size) { newProperty.size = size }
            if (address) { newProperty.address = address }
            if (condition) { newProperty.condition = condition }
            newProperty.approved = false;
            // Find the property to be updated and update it
            let property = await Property.findById(req.params.id);
            
            if (!property) { return res.status(404).send("Not found"); }

            if (property.user.toString() !== req.user.id) {
                return res.status(401).send("Not allowed");
            }
            property = await Property.findByIdAndUpdate(req.params.id, { $set: newProperty }, { new: true });
            res.json({ property });
        }
        catch (error) {
            console.log(error.message);
            res.status(500).send("Internal server Error Occured")
        }
    }
);

router.delete("/deleteproperty/:id", authoriseuser,
    async (req, res) => {
        try {
            let property = await Property.findById(req.params.id);
            if (!property) {
                res.status(404).send("Not Found");
            }
            property = await Property.findByIdAndDelete(req.params.id);

            res.json({ "success": "Property has been deleted", property: property });
        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error Occured");
        }
    }
);

router.get('/getallownproperty',authoriseuser,
    async (req, res) => {
        try {
            const property = await Property.find({ user: req.user.id });
            res.json(property);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Internal Server Error');
        }
    }
);

router.get('/getallpropertyt', async (req, res) => {
    try {
        const { city, categories, type} = req.query;
        const filter = { approved: true };

        if (city) filter.city = city;
        if (type) filter.type = type;
        if (categories) filter.categories = categories;

        const properties = await Property.find(filter);
        res.json(properties);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/getallproperty', async (req, res) => {
    try {
        const { categories } = req.query;

        const properties = await Property.find({categories:categories, approved:true});
        res.json(properties);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/getallpropertyapp', async (req, res) => {
    try {
        const { propertyId } = req.query;

        const properties = await Property.find({_id:propertyId, approved:false});
        res.json(properties);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/getallpropertyappt', async (req, res) => {
    try {
        const { propertyId } = req.query;

        const properties = await Property.find({_id:propertyId, approved:true});
        res.json(properties);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/approveproperty/:id', async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ error: "Property not found" });

        property.approved = true;
        await property.save();

        res.json({ message: "Property approved successfully", property });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Fetch all pending properties (not approved)
router.get("/pending", async (req, res) => {
    try {
        const pendingProperties = await Property.find({ approved: false });
        res.json(pendingProperties);
    } catch (error) {
        console.error("Error fetching pending properties:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/cities', async (req, res) => {
    try {
        const cities = await City.find();
        res.json(cities);
    } catch (error) {
        res.status(500).json({ message: "Error fetching cities", error });
    }
});

module.exports = router;