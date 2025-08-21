import DefaultTheme from "vitepress/theme";
import "./custom.css";
import mermaid from "mermaid";

export default {
  ...DefaultTheme,
  enhanceApp({ app, router }) {
    if (typeof window !== "undefined") {
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        flowchart: {
          htmlLabels: true,
        },
      });

      router.onAfterRouteChanged = () => {
        mermaid.run({
          nodes: document.querySelectorAll(".mermaid"),
        });
      };
    }
  },
};
