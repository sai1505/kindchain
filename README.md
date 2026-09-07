# KINDCHAIN

> **One good deed shouldn't end with you.**

KINDCHAIN is a platform for passing kindness forward.

Instead of repaying the person who helped you, you can help someone else. Every verified act becomes part of a growing chain of generosity.

KINDCHAIN focuses on **non-monetary generosity** — sharing knowledge, time, skills, guidance, and useful resources.

## 🌐 Live Demo

**https://kindchain-one.vercel.app/**

---

## 💡 What is KINDCHAIN?

Imagine this:

**Sai** needs help learning Python.

↓

**Arun** gives Sai 30 minutes of Python tutoring.

↓

Instead of Sai repaying Arun, Sai helps **Priya** prepare for an interview.

↓

Priya shares useful learning resources with **Rahul**.

The original act of kindness keeps moving.

That's KINDCHAIN.

### The idea

> **Don't pay kindness back. Pass it forward.**

The platform makes this chain visible and shows how far an act of generosity has travelled.

---

## ✨ Features

### 🤝 Ask for Help

Anyone can post something they need.

Requests can be for:

- Knowledge
- Time
- Resources

There is no requirement for the request to involve money.

### 💡 Share Knowledge

Help someone by teaching or explaining something you know.

Examples:

- Programming
- Interview preparation
- Academic subjects
- Career guidance
- Mentoring
- Skills

### ⏱️ Give Your Time

Sometimes the most valuable thing you can give is your time.

Users can offer help through:

- One-on-one guidance
- Discussions
- Mentoring
- Practical help
- Google Meet sessions

### 📚 Share Resources

Resources aren't limited to one format.

A helper can share:

- YouTube videos
- PDFs
- GitHub repositories
- Articles
- Google Drive links
- Documentation
- Other useful links

Multiple resources can be shared as part of a single act of kindness.

### ✅ Verify Acts

When someone offers help, the act starts as **pending**.

The person receiving the help can confirm that the help was actually received.

Once confirmed, the act becomes **verified** and can become part of the generosity chain.

### 🔗 Generosity Chain

Verified acts form a chain:

```text
Person A
   ↓
helps Person B
   ↓
Person B
   ↓
helps Person C
   ↓
Person C
   ↓
helps Person D
```

Instead of measuring generosity through money, KINDCHAIN measures:

> **How far did the kindness travel?**

### 📤 Share KINDCHAIN

The chain page also lets users share KINDCHAIN with others.

The goal is simple:

**Help someone discover the platform and keep the idea moving.**

---

## 🔄 How It Works

The core KINDCHAIN loop is:

```text
Need
  ↓
Someone offers help
  ↓
Act is created
  ↓
Help happens
  ↓
Recipient confirms
  ↓
Act becomes verified
  ↓
Generosity chain grows
  ↓
Pass kindness forward
```

---

## 🏗️ Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Tabler Icons

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Storage

### Deployment

- Vercel

### Integrations

- Google Meet for Knowledge and Time based help

---

## 🗄️ Database Structure

KINDCHAIN uses three main tables.

### `users`

Stores people participating in the community.

```text
id
name
email
created_at
```

### `needs`

Stores requests posted by users.

```text
id
user_id
title
description
type
status
meet_link
created_at
```

### `acts`

Stores connections between people who give and receive help.

```text
id
giver_id
receiver_id
need_id
type
description
resources
status
created_at
verified_at
```

The `resources` field uses JSONB so a single act can contain multiple resources.

Example:

```json
[
  {
    "type": "pdf",
    "url": "https://example.com/guide.pdf"
  },
  {
    "type": "youtube",
    "url": "https://youtube.com/watch?v=example"
  },
  {
    "type": "github",
    "url": "https://github.com/example/project"
  }
]
```

---

## 🔐 User Flow

KINDCHAIN intentionally keeps onboarding simple.

Users provide:

```text
Name
Email
```

There is no complicated authentication flow required for the core experience.

The current user is remembered locally so they can:

- Post needs
- Offer help
- Confirm received help
- View their generosity chain

---

## 🚀 Getting Started

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd kindchain
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🪣 Supabase Storage

KINDCHAIN uses a Supabase Storage bucket called:

```text
resources
```

The bucket is used when helpers upload resources such as PDFs or other files.

For the current implementation, the bucket should be configured as **public** so uploaded resources can be accessed through their generated public URLs.

---

## 🎯 Design Philosophy

KINDCHAIN was intentionally built differently from traditional charity platforms.

It is **not**:

- A donation tracker
- A crowdfunding platform
- An NGO directory
- A volunteer marketplace
- A money-transfer platform

Instead, KINDCHAIN asks:

> **What if generosity could create a chain?**

Someone helps you.

You don't owe them.

You help someone else.

That person helps someone else.

And the kindness continues.

---

## 🌱 Future Ideas

Some ideas that could be added in future versions:

- AI-powered matching between needs and helpers
- A branching generosity graph
- Richer chain visualizations
- More detailed impact statistics
- User profiles and generosity history
- Magic-link authentication
- Calendar integration
- Smarter resource recommendations
- Community reputation based on verified acts

---

## 🏆 Weekend Challenge

Built for:

**DEV Weekend Challenge: Generosity Edition**

The project explores a simple question:

> **Can technology help kindness travel further?**

---

## 📜 License

This project is currently built as a hackathon project.

---

## ❤️ KINDCHAIN

**One good deed shouldn't end with you.**

**Help someone.  
Pass it forward.**
