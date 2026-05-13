import { generateContainer } from "./app/app.js";
import { appendViewContent } from "./app/app.js";
import { ReactRunlabButton } from "./reactButton.jsx";

let runtimeUrl = "";
function setRuntimeUrl(url) {
  runtimeUrl = url;
}
function getRuntimeUrl() {
  return runtimeUrl;
}

export async function run({
  parentId,
  runtimeUrl = ""
}) {
  generateContainer(parentId);
  setRuntimeUrl(runtimeUrl);
}

export async function sendCode(code, ext = "txt") {

  const runnableExtensions = ["js", "ts", "py"];
  if (!runnableExtensions.includes(ext)) {
    appendViewContent(code);
    return;
  }

  try {
    const response = await fetch(getRuntimeUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code, ext })
    });

    if (!response.ok) {
      throw new Error("Failed to send code");
    }

    const data = await response.json();

    appendViewContent(data.stdout || data.stderr);
  } catch (err) {
    console.error(err);
  }
}

//=============================== Buttons ===============================

export { ReactRunlabButton };
