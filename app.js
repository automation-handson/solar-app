const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const cors = require('cors');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());



mongoose.connect(process.env.MONGO_URI, {

}).then(() => {
    console.log("MongoDB Connection Successful");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

const Schema = mongoose.Schema;

const dataSchema = new Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});
const planetModel = mongoose.model('planets', dataSchema);

app.post('/planet', async (req, res) => {
    try {
        const planetData = await planetModel.findOne({ id: req.body.id });
        if (!planetData) {
            return res.status(404).send("Planet not found");
        }
        res.send(planetData);
    } catch (err) {
        console.error("Error fetching planet data:", err);
        res.status(500).send("Error in Planet Data");
    }
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get('/os', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "os": OS.hostname(),
        "env": process.env.NODE_ENV
    });
});

app.get('/live', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "status": "live"
    });
});

app.get('/ready', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "status": "ready"
    });
});

app.listen(3000, () => {
    console.log("Server successfully running on port - " + 3000);
});

module.exports = app;