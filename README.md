# RunLab

RunLab is an NPM package that provides an isolated, browser-based IDE for teaching, demonstrating, and testing programming skills across multiple languages.

<img src="https://i.ibb.co/5WZJ69WD/runlab2.png" alt="runlab-2.0.0" border="0"></a>

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

RunLab also provides a ready-to-use React component that renders a button to toggle the IDE.

Import the component as follows:

```javascript
import { ReactRunlabButton } from "runlab/react";
```

Then create a configuration object:

```javascript
const runConfig = {
  parentId: "runlab-custom-div",
  runtimeUrl: "http://localhost:8080",
};
```

Finally, render the component:

```jsx
<ReactRunlabButton runConfig={runConfig} />
```

The component handles showing and hiding the IDE automatically, so no additional button logic is required.


### Vue

RunLab also provides a ready-to-use Vue component that renders a button to toggle the IDE.

Import the component:

```javascript
import { VueRunlabButton } from "runlab/vue";
```

Create the configuration object:

```javascript
const runConfig = {
  parentId: "runlab-custom-div",
  runtimeUrl: "http://localhost:3000",
};
```

Then use the component in your template:

```vue
<VueRunlabButton :run-config="runConfig" />
```

The component automatically handles showing and hiding the IDE, so no additional button logic is required.

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
  runtimeUrl: "http://localhost:8080",
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

# Integrating the Runtime

To execute code from the IDE, you need a runtime server responsible for bundling and running the source files.

The runtime is written in Rust and is available as a Docker image, making it easy to deploy on any machine or server.

The Docker image is available on Docker Hub:

https://hub.docker.com/r/caiolr/runlab-runtime

Pull the image using:

```bash
docker pull caiolr/runlab-runtime
```

Then start the runtime server:

```bash
docker run -d --name runlab-runtime -p 8080:8080 caiolr/runlab-runtime
```

Once the container is running, configure RunLab to connect to the runtime by setting the `runtimeUrl` option:

```javascript
const runConfig = {
  parentId: "runlab-container",
  runtimeUrl: "http://localhost:8080",
};
```

# Customization

RunLab can be customized through an optional configuration JSON. If no configuration is provided, the default settings included with the library will be used.

Currently, the only available customization is the list of file extensions that can be executed by the runtime. This can be configured using the `runnableExtensions` option, which accepts an array of strings related to the file extensions.

For example:

```json
{
  "runnableExtensions": [
    "js",
    "ts",
    "py"
  ]
}
```

> **Note:** Additional IDE customization options will be introduced in future releases.

> **Note:** Runtime configuration options are also planned for future releases.