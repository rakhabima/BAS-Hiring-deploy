# BAS-Hiring

BAS-Hiring is a **MERN Stack** (MongoDB, Express, React, Node.js) project for an outsourcing recruitment system.

## 📌 Setup & Run the Project

### 1. Clone the Repository
```sh
git clone https://github.com/fikriwahab/BAS-Hiring.git
cd BAS-Hiring
```

### 2. Install Dependencies
```sh
# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 3. Run the Project
```sh
# Start Backend
cd ../server
npm start

# Start Frontend
cd ../client
npm start
```

### 4. Configure MongoDB
Create a **.env** file inside the `server` folder and add:
```sh
MONGO_URI=<your_mongodb_connection_string>
PORT=5000
```
Replace `<your_mongodb_connection_string>` with your **MongoDB Atlas Connection String**.

### 5. Login & Testing
- **Backend runs on:** `http://localhost:5000`
- **Frontend runs on:** `http://localhost:3000`

