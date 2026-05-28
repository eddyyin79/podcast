# POD|Up Full Temporary Website

A more complete temporary podcast website for Vercel.

## Features

Listener side:
- Beautiful homepage
- Categories / seasons
- Search
- Featured episodes
- MP3 players
- Hidden categories/files do not show publicly

Admin side:
- Admin PIN login
- Add categories
- Edit categories
- Hide/show categories
- Delete categories
- Upload MP3 files
- Edit episodes
- Move episodes between categories
- Hide/show episodes
- Feature/unfeature episodes
- Delete episodes
- Site settings: name, tagline, homepage announcement
- Stats dashboard
- Reset everything

## Admin PIN

580611

## Important

This intentionally uses temporary server memory only.  
There is no database and no permanent storage.

On Vercel, data can disappear when:
- Vercel restarts the serverless function
- the site redeploys
- memory is cleared
- a new serverless instance starts

That is expected.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Deploy to Vercel

1. Create a GitHub repo.
2. Upload every file in this folder.
3. Go to Vercel.
4. Add New Project.
5. Import the GitHub repo.
6. Deploy.

Do not deploy a single file. Deploy the whole project folder.
