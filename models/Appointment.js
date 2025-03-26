const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    propertyId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "property"
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    appointmentDate:{
        type:String,
        required:true
    },
    date: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model("appointment",AppointmentSchema)