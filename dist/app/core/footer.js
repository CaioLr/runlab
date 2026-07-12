import { connectingIcon, connectedIcon, disconnectedIcon } from "../assets/connStatusSvg.js";

export function createFooter(parentId) {
  const footer = document.createElement("div");
  footer.id = "runlab-footer-grid";
  Object.assign(footer.style, {
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr"
  });

  const leftDiv = document.createElement("div");
  leftDiv.id = "runlab-footer-left";
  Object.assign(leftDiv.style, {
    display: "flex",
    alignItems: "center",
  });

  const centerDiv = document.createElement("div");
  centerDiv.id = "runlab-footer-center";
  Object.assign(centerDiv.style, {
  });

  const rightDiv = document.createElement("div");
  rightDiv.id = "runlab-footer-right";
  Object.assign(rightDiv.style, {
  });

  const connStatus = document.createElement("div");
  connStatus.id = "runlab-footer-conn-status";
  Object.assign(connStatus.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "left",
    padding: "5px 10px",
  });
  const statusIcon = document.createElement("div");
  statusIcon.id = "runlab-footer-conn-status-icon";
  statusIcon.innerHTML=connectingIcon;
  Object.assign(statusIcon.style, {
    display: "flex",
    alignItems: "center",
    width: "15px",
    height: "15px"
  });
  
  const statusText = document.createElement("span");
  statusText.id = "runlab-footer-conn-status-text";
  statusText.textContent = "Trying to connect with runtime...";
  Object.assign(statusText.style, {
    marginLeft: "5px",
    marginTop: "0px",
    marginBottom: "0px",
    color: "#fff",
    fontSize: "0.8rem",
  });
  
  connStatus.appendChild(statusIcon);
  connStatus.appendChild(statusText);
  leftDiv.appendChild(connStatus);

  footer.appendChild(leftDiv);
  footer.appendChild(centerDiv);
  footer.appendChild(rightDiv);

  document.getElementById(parentId).appendChild(footer);
}

export function updateConnectionStatus(status) {
  const statusText = document.getElementById("runlab-footer-conn-status-text");
  const statusIcon = document.getElementById("runlab-footer-conn-status-icon");

    if (status === "connected") {
        statusText.textContent = "Connected to runtime";
        statusIcon.innerHTML=connectedIcon;
        statusIcon.alt = "Connected";
        return;
    }
    if (status === "disconnected") {
        statusText.textContent = "Disconnected from runtime";
        statusIcon.innerHTML=disconnectedIcon;
        statusIcon.alt = "Disconnected";
        return;
    }
    if (status === "connecting") {
        statusText.textContent = "Trying to connect with runtime...";
        statusIcon.innerHTML = connectingIcon;
        statusIcon.alt = "Connecting";
        return;
    }
    return;
}