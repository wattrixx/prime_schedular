// File: app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const indexRoutes = require('./routes/index');
const whatsappRoutes = require('./routes/whatsappRoutes');
require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/', indexRoutes);
app.use('/whatsapp', whatsappRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});