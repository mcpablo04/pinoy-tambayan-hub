/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://pinoytambayanhub.com", // ← change if needed
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [
    "/login",
    "/auth/*",
    "/admin/*"
  ],
  // Tweak defaults for freshness/importance
  changefreq: "weekly",
  priority: 0.7,
  transform: async (config, path) => {
    // Example: boost some sections
    if (["/news", "/events", "/radio"].includes(path)) {
      return {
        loc: path,
        changefreq: "daily",
        priority: 0.8,
        lastmod: new Date().toISOString(),
        alternateRefs: config.alternateRefs ?? [],
      };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  // If you later have dynamic routes you want to enumerate, use additionalPaths:
  // additionalPaths: async (config) => {
  //   const items = await fetchYourIDs(); // build-time list
  //   return items.map((id) => ({
  //     loc: `/news/${id}`,
  //     changefreq: "daily",
  //     priority: 0.8,
  //     lastmod: new Date().toISOString(),
  //   }));
  // },
};
