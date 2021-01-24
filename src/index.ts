import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground";

import prettier from "prettier/standalone";
import tsPlugin from "prettier/parser-typescript";

const plugins = [tsPlugin];

const ERR_ID = "prettier-error";
const CONFIG_KEY = "ts-playground-plugin-prettier--config";
const getConfigFromJson = (json: string) => {
  try {
    return JSON.parse(json) as object;
  } catch (e: unknown) {}
};
const getJsonFromConfig = (config: object) => JSON.stringify(config, null, 2);

const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: "prettier",
    displayName: "Prettier",
    didMount: (sandbox, container) => {
      console.log("Loading prettier");

      let config = getConfigFromJson(localStorage[CONFIG_KEY]) || {};
      let previousText = "";

      // Create a design system object to handle
      // making DOM elements which fit the playground (and handle mobile/light/dark etc)
      const ds = utils.createDesignSystem(container);

      ds.p(
        "Press the button to run Prettier. Press Undo to restore unprettier code."
      );

      const startButton = document.createElement("input");
      startButton.type = "button";
      startButton.value = "Make Pretty!";
      container.appendChild(startButton);

      startButton.onclick = () => {
        const maybeErrEl = document.getElementById(ERR_ID);
        if (maybeErrEl) {
          maybeErrEl.parentElement.removeChild(maybeErrEl);
        }
        try {
          const currentText = sandbox.getText();
          const result = prettier.format(currentText, {
            parser: "typescript",
            plugins,
            ...config,
          });
          sandbox.setText(result);
          previousText = currentText;
        } catch (e) {
          const el = ds.p("Err!" + e.message.split("\n").join("<br/>"));
          el.setAttribute("id", ERR_ID);
          utils.flashHTMLElement(el);
          // probably a syntax error
          console.log("err", e.message);
        }
      };

      const undoButton = document.createElement("button");
      undoButton.textContent = "Undo!";
      undoButton.style.margin = "0 20px";
      undoButton.onclick = () => {
        if (previousText) sandbox.setText(previousText);
      };
      container.appendChild(undoButton);

      ds.p(
        "Add optional Prettier config in JSON format (automatically saved to localStorage)."
      );

      const configTextarea = document.createElement("textarea");
      configTextarea.value = getJsonFromConfig(config);
      configTextarea.style.width = "200px";
      configTextarea.style.height = "180px";
      configTextarea.onblur = () => {
        const newConfig = getConfigFromJson(configTextarea.value);

        if (!newConfig) return;

        config = newConfig;

        const newConfigJson = getJsonFromConfig(config);

        configTextarea.value = newConfigJson;
        localStorage[CONFIG_KEY] = newConfigJson;
      };
      container.appendChild(configTextarea);
    },
  };

  return customPlugin;
};

export default makePlugin;
