import { useEffect } from 'react';
import { run } from "./index.js";

export function ReactRunlabButton(props = { runConfig: {} }) {
  const { runConfig } = props;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__runlab_started) return;

    if (typeof window !== 'undefined') {
      window.__runlab_started = true;
    }

    run(runConfig);
  }, []);

  const showApp = () => {
    const app = document.getElementById("runlab-custom-div");
    const btn = document.getElementById("runlab-custom-btn");

    const displayStyle = window.getComputedStyle(app).display;

    if (displayStyle === "none") {
      app.style.display = "block";
      btn.textContent = "Hide App";
    }
    if (displayStyle === "block") {
      app.style.display = "none";
      btn.textContent = "Show App";
    }
  };

  return (
    <>
      <button
        id="runlab-custom-btn"
        onClick={showApp}
        className="show-app-button"
      >
        Show App
      </button>

      <div id="runlab-custom-div" style={{ display: "none" }}></div>
    </>
  );
}
