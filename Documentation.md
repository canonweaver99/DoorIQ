# Realtime API with WebRTC — Project Documentation

This document is a canonical reference for connecting our app to OpenAI’s Realtime API. Always consult this file when working on ephemeral token minting, session initialization, or WebRTC client connections.

---

## Connect to the Realtime API using WebRTC

WebRTC is a powerful set of standard interfaces for building real-time applications. The OpenAI Realtime API supports connecting to realtime models through a WebRTC peer connection.

For browser-based speech-to-speech voice applications, we recommend starting with the Agents SDK for TypeScript:
- Agents SDK: https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/

When connecting to a Realtime model from the client (like a web browser or mobile device), we recommend using WebRTC rather than WebSockets for more consistent performance.

More UI guidance for WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

---

## Overview

The Realtime API supports two mechanisms for connecting to the Realtime API from the browser, either using ephemeral API keys (generated via the OpenAI REST API), or via the new unified interface. Generally, using the unified interface is simpler, but puts your application server in the critical path for session initialization.

### 1) Connecting using the unified interface

Process (web browser client):
1. The browser makes a request to a developer-controlled server using the SDP data from its WebRTC peer connection.
2. The server combines that SDP with its session configuration in a multipart form and sends that to the OpenAI Realtime API, authenticating it with its standard API key.

#### Creating a session via the unified interface (example)

```javascript
import express from "express";

const app = express();

// Parse raw SDP payloads posted from the browser
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

const sessionConfig = JSON.stringify({
    session: {
        type: "realtime",
        model: "gpt-realtime",
        audio: {
            output: {
                voice: "marin",
            },
        },
    },
});

// An endpoint which creates a Realtime API session.
app.post("/session", async (req, res) => {
    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", sessionConfig);

    try {
        const r = await fetch("https://api.openai.com/v1/realtime/calls", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: fd,
        });
        // Send back the SDP we received from the OpenAI REST API
        const sdp = await r.text();
        res.send(sdp);
    } catch (error) {
        console.error("Session creation error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

app.listen(3000);
```

#### Client (browser) connecting to the server

```javascript
// Create a peer connection
const pc = new RTCPeerConnection();

// Set up to play remote audio from the model
audioElement.current = document.createElement("audio");
audioElement.current.autoplay = true;
pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

// Add local audio track for microphone input in the browser
const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(ms.getTracks()[0]);

// Set up data channel for sending and receiving events
defaultDataChannel = pc.createDataChannel("oai-events");

// Start the session using the Session Description Protocol (SDP)
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpResponse = await fetch("/session", {
    method: "POST",
    body: offer.sdp,
    headers: {
        "Content-Type": "application/sdp",
    },
});

const answer = { type: "answer", sdp: await sdpResponse.text() };
await pc.setRemoteDescription(answer);
```

---

### 2) Connecting using an ephemeral token

Process (web browser client):
1. The browser makes a request to a developer-controlled server to mint an ephemeral API key.
2. The developer's server uses a standard API key to request an ephemeral key from the OpenAI REST API, and returns that new key to the browser.
3. The browser uses the ephemeral key to authenticate a session directly with the OpenAI Realtime API as a WebRTC peer connection.

#### Creating an ephemeral token (server)

```javascript
import express from "express";

const app = express();

const sessionConfig = JSON.stringify({
    session: {
        type: "realtime",
        model: "gpt-realtime",
        audio: {
            output: {
                voice: "marin",
            },
        },
    },
});

// Returns contents of a REST API request to this protected endpoint
app.get("/token", async (req, res) => {
    try {
        const response = await fetch(
            "https://api.openai.com/v1/realtime/client_secrets",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: sessionConfig,
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

app.listen(3000);
```

#### Client (browser) using the ephemeral token

```javascript
// Get a session token for OpenAI Realtime API
const tokenResponse = await fetch("/token");
const data = await tokenResponse.json();
const EPHEMERAL_KEY = data.value;

// Create a peer connection
const pc = new RTCPeerConnection();

// Set up to play remote audio from the model
audioElement.current = document.createElement("audio");
audioElement.current.autoplay = true;
pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

// Add local audio track for microphone input in the browser
const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(ms.getTracks()[0]);

// Set up data channel for sending and receiving events
const dc = pc.createDataChannel("oai-events");

// Start the session using the Session Description Protocol (SDP)
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: offer.sdp,
    headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
    },
});

const answer = { type: "answer", sdp: await sdpResponse.text() };
await pc.setRemoteDescription(answer);
```

---

## Sending and receiving events

Realtime API sessions are managed using a combination of client-sent events and server-sent events. With WebRTC, the peer connection handles model audio. Use the data channel for other events.

```javascript
// Data channel from the client example above
const dc = pc.createDataChannel("oai-events");

// Listen for server events
dc.addEventListener("message", (e) => {
    const event = JSON.parse(e.data);
    console.log(event);
});

// Send client events
const event = {
    type: "conversation.item.create",
    item: {
        type: "message",
        role: "user",
        content: [
            { type: "input_text", text: "hello there!" },
        ],
    },
};
dc.send(JSON.stringify(event));
```

More: Realtime conversations guide — https://platform.openai.com/docs/guides/realtime-conversations

Realtime Console example app — https://github.com/openai/openai-realtime-console/

---

## Notes for DoorIQ

- We use the ephemeral-token flow in production. The browser only hits `/api/rt/token`.
- Never expose `OPENAI_API_KEY` to the browser; server-only.
- Every conversation must mint a new ephemeral token (short-lived).
- When updating token logic or WebRTC flow, reference this document.

---

## OpenAI Realtime Console — Installation & Usage

This is an example application showing how to use the OpenAI Realtime API with WebRTC. It’s a minimal template that uses Express to serve a React frontend, with Vite to build the frontend.

### Requirements
- Node.js installed
- An OpenAI API key (create in the OpenAI dashboard)

### Setup
```bash
# Clone the repo then:
cp .env.example .env
# Add your API key in .env

npm install
npm run dev
```

The console runs at http://localhost:3000.

It demonstrates:
- Sending/receiving Realtime API events over the WebRTC data channel
- Client-side function calling configuration
- Logging panel to view JSON payloads for client/server events

For a more comprehensive example, see the OpenAI Realtime Agents demo built with Next.js using an agentic architecture (inspired by OpenAI Swarm).
