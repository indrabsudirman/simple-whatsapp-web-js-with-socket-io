import { useState, useEffect } from "react";
import "./App.css";
import { io } from "socket.io-client";
import QRCode from "react-qr-code";
const socket = io("http://localhost:3000", {});

function App() {
  const [session, setSession] = useState("089636002345");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    socket.emit("connected", "Hello from client");
    socket.on("connect", () => {
      console.log(`connect from ${socket.id}`);
    });
    socket.on("qr", (data) => {
      const { qr } = data;
      console.log(`Qr received from BE ${qr}`);
      setQrCode(qr);
    });
  }, []);

  const createSessionsForWhatsapp = () => {
    socket.emit("createSession", {
      id: session, //value session will take from cookie get phoneNumber payload
    });
    setSession("");
    console.log(`Create session start with id ${session}`);
  };

  return (
    <>
      <h1>Whatsapp Web JS with ChatGPT</h1>
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
          <button onClick={createSessionsForWhatsapp}>Create Session</button>
        ) : (
          <QRCode value={qrCode} />
        )}
      </div>
    </>
  );
}

export default App;
