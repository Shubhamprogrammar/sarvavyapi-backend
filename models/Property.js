const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    categories: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    
    condition: {
        type: String,
        required: true
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    approved: { type: Boolean, default: false },
})

module.exports = mongoose.model("property", PropertySchema)