const express = require("express");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// 🔥 CONNECT DATABASE (FIXED)
mongoose.connect("mongodb+srv://admin:1234@cluster0.fecvqbh.mongodb.net/hospital")
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

// MODEL
const patientSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model("Patient", patientSchema);

// UPLOAD FOLDER
const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 ADD / UPDATE (MONGODB)
app.post("/add-patient", upload.array("media"), async (req, res) => {

  const body = req.body;

  if (req.files) {
    body.media = req.files.map(f => f.filename);
  }

  if (body.index) {
    await Patient.findByIdAndUpdate(body.index, body);
  } else {
    body.date = new Date();
    await Patient.create(body);
  }

  res.json({ message: "Saved" });
});

// 🔥 DELETE
app.post("/delete-patient", async (req, res) => {
  await Patient.findByIdAndDelete(req.body.id);
  res.json({ message: "Deleted" });
});

// 🔥 GET
app.get("/patients", async (req, res) => {
  const data = await Patient.find();
  res.json(data);
});

// 🔥 DASHBOARD
app.get("/dashboard", async (req, res) => {
  const patients = await Patient.find();

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = patients.filter(p => p.date && p.date.toISOString().startsWith(today)).length;

  res.json({ total: patients.length, today: todayCount });
});

app.listen(3000, () => console.log("Server running"));