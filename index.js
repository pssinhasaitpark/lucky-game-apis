import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./app/routes/index.js";
import { connectDB } from "./app/config/dbConfig.js";

dotenv.config();

const app = express();
const host = process.env.HOST;
const port = process.env.PORT || 5050;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.0.136:5173",
      "http://192.168.0.239:8082",
      "http://192.168.0.239:8081",
      "http://localhost:8081",
      "http://localhost:8082",
      "https://lucky-game-admin.vercel.app",
    ],
    methods: ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

connectDB();
routes(app);

app.get("/", (req, res) => {
  return res.status(200).send({
    error: false,
    message: "Lucky game project api's",
  });
});

app.get("/api/v1/time", (req, res) => {
  res.json({ currentTime: new Date().toISOString() });
});

app.listen(port, host, () =>
  console.log(`App is listening at port: http://${host}:${port}`)
);
