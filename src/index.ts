import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground";

import prettier from "prettier/standalone";
import estreePlugin from "prettier/plugins/estree";
import tsPlugin from "prettier/plugins/typescript";

const plugins = [estreePlugin, tsPlugin];

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

      startButton.onclick = () =>
        sandbox.editor.trigger("action", "editor.action.formatDocument", null);

      function formatText(currentText: string) {
        const maybeErrEl = document.getElementById(ERR_ID);
        if (maybeErrEl) {
          maybeErrEl.parentElement.removeChild(maybeErrEl);
        }

        try {
          const result = prettier.format(currentText, {
            parser: "typescript",
            plugins,
            ...config,
          });

          return result;
        } catch (e) {
          const el = ds.p("Err!" + e.message.split("\n").join("<br/>"));
          el.setAttribute("id", ERR_ID);
          utils.flashHTMLElement(el);
          // probably a syntax error
          console.log("err", e.message);
        }
      }

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

      sandbox.monaco.languages.registerDocumentFormattingEditProvider(
        "typescript",
        {
          async provideDocumentFormattingEdits(model) {
            const text = await formatText(model.getValue());

            if (!text) return [];

            return [
              {
                text,
                range: {
                  startLineNumber: 0,
                  startColumn: 1,
                  endLineNumber: model.getLineCount(),
                  endColumn: 1,
                },
              },
            ];
          },
        }
      );
    },
  };

  return customPlugin;
};

export default makePlugin;
