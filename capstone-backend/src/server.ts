import "dotenv/config";

import express from "express";
import { supabase } from "./lib/supabase.ts";
import appointments from "./routes/appointments.ts";
import users from "./routes/users.ts";
import slots from "./routes/slots.ts";
import events from "./routes/events.ts";
import mock from "./routes/mock.ts";
import auth from "./routes/auth.ts";
import session from "./routes/session.ts";
import http from "http";
import cors from "cors";
import { ChatController } from "./chat/ChatController.ts";
import { initChatSocket } from "./ws/chatSocket.ts";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.use(cors());

app.use("/appointments", appointments);
app.use("/users", users);
app.use("/slots", slots);
app.use("/events", events);
app.use("/mock", mock);
app.use("/auth", auth);
app.use("/session", session);

const chatController = new ChatController();
app.post("/chat", chatController.handle);

const server = http.createServer(app);

initChatSocket(server);

server.listen(port, () => {
    console.log(`Listening on Port ${port}`);
    console.log(`GoTo : http://localhost:${port}`);
    console.log(`WS + HTTP running on ${port}`);
});
