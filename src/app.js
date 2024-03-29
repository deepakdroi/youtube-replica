import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routers
import userRouter from "../routes/user.routes.js";
import videoRouter from "../routes/video.routes.js";

//declaring routes
app.use("/api/v2/user", userRouter);
app.use("/api/v2/video", videoRouter);

export default app;
