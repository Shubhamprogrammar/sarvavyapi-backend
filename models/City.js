const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: String,
    state: String,
    type: String
});

module.exports = mongoose.model("places", citySchema);