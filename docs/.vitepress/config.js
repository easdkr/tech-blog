import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  title: "Wisely Tech Blog",
  description: "A tech blog for Wisely.",
  base: "/tech-blog/",
  mermaid: {
    theme: "default",
  },

  themeConfig: {
    nav: [{ text: "Home", link: "/" }],
    sidebar: [
      {
        text: "데이터 아키텍처",
        items: [
          { text: "개요", link: "/" },
          { text: "Data Mart", link: "/posts/data-architecture/data-mart" },
          {
            text: "Data Warehouse",
            link: "/posts/data-architecture/data-warehouse",
          },
          { text: "Data Lake", link: "/posts/data-architecture/data-lake" },
          {
            text: "아키텍처 비교",
            link: "/posts/data-architecture/data-architecture-comparison",
          },
        ],
      },
      {
        text: "데이터 엔지니어링",
        items: [
          {
            text: "DBT 기초",
            link: "/posts/data-engineering/dbt-basics",
          },
          {
            text: "Dagster 기초",
            link: "/posts/data-engineering/dagster-basics",
          },
          {
            text: "Data Mart Dagster 아키텍처",
            link: "/posts/data-engineering/data-mart-dagster-architecture",
          },
        ],
      },
      {
        text: "기타 문서",
        items: [{ text: "My First Post", link: "/posts/first-post" }],
      },
    ],
  },
});
