const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

router.post('/addappointment',
    async (req, res) => {
        try {
            const { name, email, mobile, appointmentDate, propertyId } = req.body;
    
            if (!name || !email || !mobile || !appointmentDate) {
                return res.status(400).json({ error: "Please provide all fields" });
            }
    
            const appointment = new Appointment({
                propertyId,
                name,
                email,
                mobile,
                appointmentDate,
            });
    
            await appointment.save();
            res.status(201).json({ message: "Appointment added successfully", appointment });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

module.exports = router;