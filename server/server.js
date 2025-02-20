// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Gunakan variabel global untuk caching koneksi
if (!global.mongoose) {
  mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => {
    console.log("MongoDB connected");
    global.mongoose = mongoose;
  })
  .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.log("Using cached MongoDB connection");
}

// Contoh route
app.get('/', (req, res) => {
  res.send('BAS Hiring API is running');
});

// Jalankan app.listen hanya saat berjalan secara lokal
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
