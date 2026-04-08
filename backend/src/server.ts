import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";

import sessionRoutes from "./routes/session";
import { setupChatGateway } from "./ws/chatGateway";
import userRoutes from "./routes/users";
import slotRoutes from "./routes/slots";
import appointmentRoutes from "./routes/appointments";
import events from "./routes/events";
import authRoutes from "./routes/auth";
import mockRoutes from "./routes/mock";

console.log(process.env.GEMINI_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/session", sessionRoutes);
app.use("/users", userRoutes);
app.use("/slots", slotRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/events", events);

app.use("/auth", authRoutes);

app.use("/mock", mockRoutes);

const server = http.createServer(app);

setupChatGateway(server);

const PORT = 4000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
