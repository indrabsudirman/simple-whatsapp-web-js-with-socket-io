import express from "express";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth, RemoteAuth } = pkg;
const app = express();
const port = 3000;

import http from "http";
const server = http.createServer(app);
import { Server } from "socket.io";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const MONGO_DB_LOCAL = "mongodb://localhost:27017/whatsapp-web-with-chatgpt";
let store;

mongoose.connect(MONGO_DB_LOCAL).then(() => {
  console.log(`Connected to MongoDB`);
  store = new MongoStore({ mongoose: mongoose });
  // console.log(store);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const allSessionsObject = {};

const createWhatsappSession = (id, socket) => {
  console.log(`Create whatsapp session id ${id}`);
  const client = new Client({
    puppeteer: {
      headless: true,
    },
    authStrategy: new RemoteAuth({
      clientId: id,
      store: store,
      backupSyncIntervalMs: 300000,
    }),
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED 1", qr);
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

  client.on("remote_session_saved", () => {
    console.log(`Remote session saved`);
    socket.emit("remote_session_saved", {
      message: "remote_session_saved",
    });
  });

  client.initialize();
};

const getWhatsappSession = async (id, socket) => {
  console.log(`Get whatsapp session id ${id}`);

  try {
    const sessionExist = await store.sessionExists({
      session: `RemoteAuth-${id}`,
    });
    console.log(sessionExist);
    if (sessionExist) {
      console.log(`Session with id ${id} already exists in the store.`);
    }

    const client = new Client({
      puppeteer: {
        headless: true,
      },
      authStrategy: new RemoteAuth({
        clientId: id,
        store: store,
        backupSyncIntervalMs: 300000,
      }),
    });

    client.on("authenticated", () => {
      console.log(`Client authenticated`);
    });

    client.on("ready", () => {
      console.log(`Client is ready`);
      socket.emit("ready", { id, message: `Client ${client} is ready` });
    });

    client.on("qr", (qr) => {
      console.log("QR RECEIVED 2", qr);
      socket.emit("qr", {
        qr,
        message: "Here is the QR, because user has logged out",
      });
    });

    client.initialize();
  } catch (error) {
    console.error(`Error checking session existence: ${error.message}`);
  }
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

  socket.on("getSession", (data) => {
    console.log(`Get old session will start with is ${data.id} in server`);
    const { id } = data;
    getWhatsappSession(id, socket);
  });

  socket.on("getAllChats", async (data) => {
    console.log(`Get All Chats ${data}`);
    const { id } = data;
    console.log(`Data id from FE for get All Chats ${id}`);
    const client = allSessionsObject[id];
    const chats = await client.getChats();
    console.log(chats);
    socket.emit("getChats", {
      chats,
    });
  });
});
