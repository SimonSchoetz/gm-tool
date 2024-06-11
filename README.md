# DM Tool by Simon Schötz

## About this project

I started this project to learn NextJS and to challenge myself to set up a full stack project from scratch again.
The plan is to build a frontend with NextJS, NestJS for the backend and a NoSQL data base probably with MongoDB.

## Vision

- build a tool for game masters to help them prepare their sessions based on Michel Shae's Lazy DM Steps
- build tools that help the during the sessions, like encounter tracker
- save data like session prep data such as locations, (N)PCs and random tables, settings, ect.

## Random Ideas and Goals

- SEO, e.g. via meta data functionalities given by nextjs

### Combat tracker

- Combine dynamoDB with Elastic Search to stream the combat
  - [General Idea](https://www.youtube.com/watch?v=OjppS4RWWt8&list=PL9nWRykSBSFi5QD8ssI0W5odL9S0309E2&index=6)
  - [How to set up a stream](https://www.youtube.com/watch?v=RhLUyJxS8Tk&list=PL9nWRykSBSFi5QD8ssI0W5odL9S0309E2&index=7)
- give Players access to their character to provide agency and enable them to help their dm managing the fight

## Decisions

### Why did I choose a NoSQL database?

To grant users high flexibility in customizing their preferred layout

---

---

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
