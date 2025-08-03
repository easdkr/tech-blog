import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // Mermaid 지원을 위한 설정
    if (typeof window !== "undefined") {
      import("mermaid").then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: true,
          theme: "default",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
        });
      });
    }
  },
};
