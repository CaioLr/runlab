# RunLab

RunLab is an NPM package that provides an isolated, browser-based IDE for teaching, demonstrating, and testing programming skills across multiple languages.

It consists of a JavaScript library that communicates with a Rust runtime, allowing users to execute code in a secure and isolated environment directly from the browser.

# How to Use

RunLab works with JavaScript applications that supports ES module imports. Simply install the package and use the provided API to show, hide, or launch the IDE from a button, link, or any other UI element.

Integration examples are available for:
- Vanilla JavaScript
- React
- Vue

## Installation

```bash
npm install runlab
```

## Quick Integration

### React

> Documentation coming soon

### Vue

> Documentation coming soon

## Integration with Vanilla JavaScript

To use RunLab in a vanilla JavaScript application, import the `run` function and call it sending a JSON with the following options:

- **parentId** *(required)*: The ID of the container where the IDE will be rendered.
- **runtimeUrl** *(optional)*: The URL of the runtime server used to execute code.
- **config** *(optional)*: A JSON configuration object that allows you to customize the IDE's frontend behavior. See the configuration guide for more details.

This is a code example:

HTML:
```html
<body>
    <button id="runlab-custom-btn">Show IDE Environment</button>
    <div id="runlab-custom-div" style="display: none;"></div>
</body>
```
JavaScript:
```javascript
import { run } from "runlab";

const runConfig = {
  parentId: "runlab-custom-div",
  runtimeUrl: "http://localhost:3000",
  config: ""
};

run(runConfig)

function showApp() {
    const app = document.getElementById("runlab-custom-div");
    const btn = document.getElementById("runlab-custom-btn");

    const displayStyle = window.getComputedStyle(app).display;

    if (displayStyle === "none") {
        app.style.display = "block";
        btn.textContent = "Hide App";
    } else {
        app.style.display = "none";
        btn.textContent = "Show IDE Environment";
    }
}

document
    .getElementById("runlab-custom-btn")
    .addEventListener("click", showApp);
```