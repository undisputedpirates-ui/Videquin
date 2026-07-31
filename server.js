import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB pripojenie
mongoose.connect("mongodb+srv://<tvoje_mongo_pripojenie>", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

// Video schema
const VideoSchema = new mongoose.Schema({
  user: String,
  filename: String,
  likes: Number,
  comments: Array
});

const Video = mongoose.model("Video", VideoSchema);

// Upload videí
const upload = multer({ dest: "uploads/" });

// Registrácia
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({ username, email, password: hashed });
  await user.save();

  res.json({ message: "Účet vytvorený" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "Nesprávny email" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: "Nesprávne heslo" });

  const token = jwt.sign({ id: user._id }, "videquin-secret");

  res.json({ message: "Prihlásenie OK", token });
});

// Upload videa
app.post("/upload", upload.single("video"), async (req, res) => {
  const video = new Video({
    user: req.body.user,
    filename: req.file.filename,
    likes: 0,
    comments: []
  });

  await video.save();
  res.json({ message: "Video nahraté" });
});

// Lajk
app.post("/like", async (req, res) => {
  const { id } = req.body;

  const video = await Video.findById(id);
  video.likes++;
  await video.save();

  res.json({ message: "Video lajknuté" });
});

// Komentár
app.post("/comment", async (req, res) => {
  const { id, comment } = req.body;

  const video = await Video.findById(id);
  video.comments.push(comment);
  await video.save();

  res.json({ message: "Komentár pridaný" });
});

// Získanie videí
app.get("/videos", async (req, res) => {
  const videos = await Video.find();
  res.json(videos);
});

app.listen(3000, () => console.log("Videquin backend beží na porte 3000"));
