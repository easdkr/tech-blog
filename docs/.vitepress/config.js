export default {
  title: 'Wisely Tech Blog',
  description: 'A tech blog for Wisely.',
  base: '/tech-blog/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
    ],
    sidebar: [
      {
        text: 'Posts',
        items: [
          { text: 'My First Post', link: '/posts/first-post' },
        ]
      }
    ]
  }
} 