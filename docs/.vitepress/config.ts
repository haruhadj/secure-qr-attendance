import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Secure QR Attendance System",
  description:
    "Documentation & thesis reference for the Secure QR Attendance System — a Next.js + Prisma school attendance platform using a Teacher-as-Scanner model.",
  lang: "en-US",
  base: "/secure-qr-attendance/",
  lastUpdated: true,
  cleanUrls: true,
  // Local dev URLs (http://localhost:3000) are intentional references, not site links.
  ignoreDeadLinks: [/^https?:\/\/localhost/],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/overview" },
      { text: "Architecture", link: "/architecture/overview" },
      { text: "User Guides", link: "/user-guides/admin" },
      { text: "Developer", link: "/developer/server-actions" },
      { text: "Thesis", link: "/thesis/methodology" },
    ],

    sidebar: [
      {
        text: "Introduction",
        collapsed: false,
        items: [
          { text: "Overview", link: "/guide/overview" },
          { text: "Problem & Objectives", link: "/guide/objectives" },
          { text: "Key Features", link: "/guide/features" },
          { text: "Glossary", link: "/guide/glossary" },
        ],
      },
      {
        text: "Getting Started",
        collapsed: false,
        items: [
          { text: "Installation", link: "/getting-started/installation" },
          { text: "Configuration", link: "/getting-started/configuration" },
          { text: "Database Setup", link: "/getting-started/database" },
          { text: "Running the App", link: "/getting-started/running" },
        ],
      },
      {
        text: "System Architecture",
        collapsed: false,
        items: [
          { text: "Architecture Overview", link: "/architecture/overview" },
          { text: "Tech Stack", link: "/architecture/tech-stack" },
          { text: "Project Structure", link: "/architecture/structure" },
          { text: "Data Flow", link: "/architecture/data-flow" },
          { text: "Auth & Access Control", link: "/architecture/auth" },
        ],
      },
      {
        text: "Database Design",
        collapsed: false,
        items: [
          { text: "Entity–Relationship Diagram", link: "/database/er-diagram" },
          { text: "Model Reference", link: "/database/models" },
        ],
      },
      {
        text: "Security",
        collapsed: false,
        items: [
          { text: "Security Model", link: "/security/model" },
          { text: "QR Token Design", link: "/security/qr-tokens" },
        ],
      },
      {
        text: "User Guides",
        collapsed: false,
        items: [
          { text: "Admin Guide", link: "/user-guides/admin" },
          { text: "Teacher Guide", link: "/user-guides/teacher" },
          { text: "Student Guide", link: "/user-guides/student" },
        ],
      },
      {
        text: "Feature Deep-Dives",
        collapsed: true,
        items: [
          { text: "QR Attendance Flow", link: "/features/qr-attendance" },
          { text: "Appeals Workflow", link: "/features/appeals" },
          { text: "Masterlist CSV Import", link: "/features/masterlist-import" },
          { text: "Audit & Activity Logging", link: "/features/audit-logging" },
          { text: "Data Management", link: "/features/data-management" },
        ],
      },
      {
        text: "Developer Reference",
        collapsed: true,
        items: [
          { text: "Server Actions", link: "/developer/server-actions" },
          { text: "API Routes", link: "/developer/api-routes" },
          { text: "Conventions & Utilities", link: "/developer/conventions" },
        ],
      },
      {
        text: "Thesis / Methodology",
        collapsed: true,
        items: [
          { text: "Methodology", link: "/thesis/methodology" },
          { text: "System Diagrams", link: "/thesis/diagrams" },
          { text: "Testing & QA", link: "/thesis/testing" },
          { text: "Limitations & Future Work", link: "/thesis/limitations" },
        ],
      },
      {
        text: "Deployment",
        collapsed: true,
        items: [
          { text: "Production Build", link: "/deployment/production" },
          { text: "Publishing These Docs", link: "/deployment/github-pages" },
        ],
      },
    ],

    outline: { level: [2, 3], label: "On this page" },

    search: { provider: "local" },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/haruhadj/secure-qr-attendance",
      },
    ],

    editLink: {
      pattern:
        "https://github.com/haruhadj/secure-qr-attendance/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "Documentation for the Secure QR Attendance System.",
      copyright: "Built for academic / thesis purposes.",
    },
  },
});
