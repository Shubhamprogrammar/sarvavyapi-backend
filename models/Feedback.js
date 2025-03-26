const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true,
    },
    email:{
        type:String,
        required:true        
    },
    feedback:{
        type:String,
        require:true
    }
})

module.exports = mongoose.model("feedback",FeedbackSchema)