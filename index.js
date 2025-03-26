const express = require('express');
const process = require('process');
const cors = require("cors");
const config = require('./models/config');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/Property', express.static(path.join(__dirname, 'Property')));
app.use('/Profile', express.static(path.join(__dirname, 'Profile')));

app.use('/api/auth',require('./routes/auth'));
app.use('/api/property',require('./routes/property'));
app.use('/api/appointment',require('./routes/appointment'));
app.use('/api/feedback',require('./routes/feedback'));
app.use('/api/admin',require('./routes/admin'));

const PORT = process.env.PORT ||5000;

app.get('/',(req,res)=>{
    res.send("Sarvavyapi - The Real Estate is running successfully");
})
app.listen(PORT,()=>{
    console.log(`Sarvavyapi - The Real Estate App is listening at port http://localhost:${PORT}`);
})