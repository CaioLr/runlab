import { h, onMounted } from "vue";
import { run } from "../index.js";

export const VueRunlabButton = {
  props: {
    runConfig: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props) {
    onMounted(() => {
      run(props.runConfig);
    });

    function showApp() {
        const app = document.getElementById("runlab-custom-div");
        const btn = document.getElementById("runlab-custom-btn");

        const displayStyle = window.getComputedStyle(app).display;

        if (displayStyle === "none") {
            app.style.display = "block";
            btn.textContent = "Hide App";
        } else {
            app.style.display = "none";
            btn.textContent = "Show App";
        }
    }

    return () =>
      h("div", [
        h(
          "button",
          {
            id: "runlab-custom-btn",
            onClick: showApp
          },
          "Show App"
        ),
        h("div", {
          id: "runlab-custom-div",
          style: "display:none"
        })
      ]);
  }
};