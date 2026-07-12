import { generateContainer } from "./app/app.js";
import { appendViewContent } from "./app/app.js";
import { ReactRunlabButton } from "./installButtons/reactButton.jsx";
import {updateConnectionStatus} from "./app/core/footer.js";
import { getNodeFromPath} from "./app/app.js";

let ws;
function setWebSocket(socket) {
  ws = socket;
}
function getWebSocket() {
  return ws;
}

let runtimeUrl = "";
function setRuntimeUrl(url) {
  runtimeUrl = url;
}
function getRuntimeUrl() {
  return runtimeUrl;
}

let currentExecuteFilePath = "";
function setCurrentExecuteFilePath(path) {
  currentExecuteFilePath = path;
}
function getCurrentExecuteFilePath() {
  return currentExecuteFilePath;
}

export async function run({
  parentId,
  runtimeUrl = ""
}) {
  generateContainer(parentId);
  setRuntimeUrl(runtimeUrl);
  try {
    setWebSocket(await connectWebSocket(runtimeUrl));
  } catch {
    handleWebSocketClose();
  }
}

async function connectWebSocket(runtimeUrl) {
  updateConnectionStatus("connecting");

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      runtimeUrl.replace(/^http/, "ws") + "/create"
    );

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Connection timeout"));
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      updateConnectionStatus("connected");
      resolve(ws);
    };

    ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.kind === "execution_response") {
        if (data.success) {
          appendViewContent(data.stdout);
        }
        if (!data.success) {
          appendViewContent(data.stderr);
        }
      }

      if (data.kind === "file_request") {

        const paths = data.path;
        let payload = [];

        paths.forEach((path) => {
          const node = getNodeFromPath(path, getCurrentExecuteFilePath());
          if (node) {
            payload.push({
              code: node.content,
              ext: node.ext
            });
          }
        });

        try {
          const ws = getWebSocket();
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
          }
          ws.send(
            JSON.stringify({
              "kind":"file_response",
              "payload":payload
            })
          ); 

        } catch (err) {
        console.error(err);
        }

      }

    } catch (err) {
      console.error("Invalid websocket message:", event.data);
    }
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      updateConnectionStatus("disconnected");
      handleWebSocketClose();
    };
  });
}

let reconnectTimer = null;

function handleWebSocketClose() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    const currentWs = getWebSocket();

    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const newWs = await connectWebSocket(getRuntimeUrl());
      setWebSocket(newWs);
    } catch {
      handleWebSocketClose();
    }
  }, 5000);
}

export async function sendCode(code, path, ext = "txt") {

  setCurrentExecuteFilePath(path);

  const runnableExtensions = ["js", "ts", "py"];
  if (!runnableExtensions.includes(ext)) {
    appendViewContent(code); 
    return;
  }

  try {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    ws.send(
      JSON.stringify({
        "kind":"execution_request",
        "payload":[{ 
          "code":code,
          "ext":ext 
        }]
      })
    ); 

  } catch (err) {
   console.error(err);
  }
}

//=============================== Buttons ===============================

export { ReactRunlabButton };
