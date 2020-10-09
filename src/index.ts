import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground";

import prettier from "prettier/standalone";
import tsPlugin from "prettier/parser-typescript";

const plugins = [tsPlugin];

const ERR_ID = "prettier-error";

const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: "prettier",
    displayName: "Prettier",
    didMount: (sandbox, container) => {
      console.log("Loading prettier");

      // Create a design system object to handle
      // making DOM elements which fit the playground (and handle mobile/light/dark etc)
      const ds = utils.createDesignSystem(container);

      ds.p(
        "Press the button to run Prettier. At this time, there's no UNDO, so be careful."
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
          const result = prettier.format(sandbox.getText(), {
            parser: "typescript",
            plugins,
          });
          sandbox.setText(result);
        } catch (e) {
          const el = ds.p("Err!" + e.message.split("\n").join("<br/>"));
          el.setAttribute("id", ERR_ID);
          utils.flashHTMLElement(el);
          // probably a syntax error
          console.log("err", e.message);
        }
      };
    },
  };

  return customPlugin;
};

export default makePlugin;
