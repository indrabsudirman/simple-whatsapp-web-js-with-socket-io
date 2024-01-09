import { useState, useEffect } from "react";
import "./App.css";
import { io } from "socket.io-client";
import QRCode from "react-qr-code";
const socket = io("http://localhost:3000", {});

function App() {
  const [session, setSession] = useState("089636002345");
  const [qrCode, setQrCode] = useState("");
  const [oldSessionID, setOldSessionID] = useState("");
  const [statusReady, setStatusReady] = useState(false);
  const [idClient, setIdClient] = useState("");

  useEffect(() => {
    socket.emit("connected", "Hello from client");
    socket.on("connect", () => {
      console.log(`connect from ${socket.id}`);
    });
    socket.on("qr", (data) => {
      const { qr, message } = data;
      console.log(`Qr received from BE ${qr}`);
      console.log(`Qr received from BE with message ${message}`);
      setQrCode(qr);
    });
    socket.on("ready", (data) => {
      console.log(`Client ready ${data.message}`);
      setStatusReady(true);
      const { id } = data;
      setIdClient(id);
    });
    socket.on("remote_session_saved", (data) => {
      const { message } = data;
      console.log(`remote_session_saved ${message}`);
    });
    socket.on("getChats", (chats) => {
      console.log(`All chats from BE are ${chats}`);
    });
  }, []);

  const createSessionsForWhatsapp = () => {
    socket.emit("createSession", {
      id: session, //value session will take from cookie get phoneNumber payload
    });
    setSession("");
    console.log(`Create session start with id ${session}`);
  };

  const getOldSession = () => {
    socket.emit("getSession", { id: oldSessionID });
    setOldSessionID("");
    console.log(`Get old session will start with id ${oldSessionID}`);
  };

  const getAllChats = () => {
    socket.emit("getAllChats", { id: idClient });
    console.log(`get All Chats with id ${session} start`);
  };

  return (
    <>
      <h1>Whatsapp Web JS with ChatGPT</h1>
      {!statusReady ? (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={oldSessionID}
              onChange={(e) => {
                setOldSessionID(e.target.value);
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <button onClick={getOldSession}>Get Old Session</button>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={session}
              onChange={(e) => {
                setSession(e.target.value);
              }}
            />
          </div>
          <div>
            {qrCode === "" ? (
              <button onClick={createSessionsForWhatsapp}>
                Create Session
              </button>
            ) : (
              <QRCode value={qrCode} />
            )}
          </div>
        </div>
      ) : (
        <div>
          <button onClick={getAllChats}>Get All Chats</button>
        </div>
      )}
    </>
  );
}

export default App;
