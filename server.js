const express = require("express");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

const getPatients = () => JSON.parse(fs.readFileSync("data.json"));
const savePatients = (d) => fs.writeFileSync("data.json", JSON.stringify(d, null, 2));

// ADD / UPDATE
app.post("/add-patient", upload.array("media"), (req, res) => {

  const body = req.body;
  const files = req.files ? req.files.map(f => f.filename) : [];

  let patients = getPatients();

  // 🔥 EDIT MODE
  if (body.index !== "" && body.index !== undefined) {
    patients[body.index] = {
      ...patients[body.index],
      ...body,
      media: files.length ? files : patients[body.index].media
    };
  } else {
    // NEW
    patients.push({
      ...body,
      media: files,
      date: new Date().toISOString()
    });
  }

  savePatients(patients);

  res.json({ message: "Saved" });
});

// DELETE
app.post("/delete-patient", (req, res) => {
  const { index } = req.body;

  let patients = getPatients();

  patients.splice(index, 1);

  savePatients(patients);

  res.json({ message: "Deleted" });
});

// GET
app.get("/patients", (req, res) => {
  res.json(getPatients());
});

// DASHBOARD
app.get("/dashboard", (req, res) => {
  const patients = getPatients();

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = patients.filter(p => p.date && p.date.startsWith(today)).length;

  res.json({ total: patients.length, today: todayCount });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));