import express from "express";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
const app = express();
const port = 3000;

import http from "http";
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const allSessionsObject = {};

const createWhatsappSession = (id, socket) => {
  const client = new Client({
    puppeteer: {
      headless: true,
    },
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    socket.emit("qr", {
      qr,
    });
  });

  client.on("authenticated", () => {
    console.log(`Client authenticated`);
  });

  client.on("ready", () => {
    console.log("Client is ready!");
    allSessionsObject[id] = client;
    socket.emit("ready", { id, message: `Client ${client} is ready` });
  });

  client.initialize();
};

io.on("connection", (socket) => {
  console.log(`a user connected from ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`a user disconneted from ${socket.id}`);
  });

  socket.on("connected", (data) => {
    console.log(`connected to the server ${data}`);

    //emit hello
    socket.emit("hello", "Hello from server");
  });

  socket.on("createSession", (data) => {
    const { id } = data;
    console.log(`data ${id}`);
    createWhatsappSession(id, socket);
  });
});
