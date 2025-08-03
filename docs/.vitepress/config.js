export default {
  title: "Wisely Tech Blog",
  description: "A tech blog for Wisely.",
  base: "/tech-blog/",
  themeConfig: {
    nav: [{ text: "Home", link: "/" }],
    sidebar: [
      {
        text: "데이터 아키텍처",
        items: [
          { text: "개요", link: "/" },
          { text: "Data Mart", link: "/posts/data-mart" },
          { text: "Data Warehouse", link: "/posts/data-warehouse" },
          { text: "Data Lake", link: "/posts/data-lake" },
          {
            text: "아키텍처 비교",
            link: "/posts/data-architecture-comparison",
          },
        ],
      },
      {
        text: "기타 문서",
        items: [{ text: "My First Post", link: "/posts/first-post" }],
      },
    ],
  },
};
