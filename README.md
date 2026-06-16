[![Netlify Status](https://api.netlify.com/api/v1/badges/8b888380-b867-4870-91c8-04ebdf823036/deploy-status)](https://app.netlify.com/sites/awesome-agnesi-2f5b8f/deploys)

# [Apple Music History](https://music.patmurray.co)

Client React app to get info from your apple music history.

Read more [on Pat Murray's site](https://patmurray.co/projects/apple-music-analyser/)

## Features

- 📊 Analyze your full Apple Music listening history
- 🎤 Top songs, artists and albums — all-time and by year
- 📈 Detailed statistics on plays, skips and listening patterns
- 📅 Calendar heatmaps and time-based analysis
- 🔒 Privacy-focused: All processing happens in your browser

## Data files

The app reads two files from your Apple privacy export (in the **Apple Music Activity** folder):

- **`Apple Music - Play History Daily Tracks.csv`** *(required)* — your full play
  history. Each row already includes the artist and song name (in `Track
  Description`), per-day play and skip counts, and a `Track Identifier`. Artists
  and songs need no extra lookup.
- **`Apple Music Library Tracks.json`** *(optional)* — used only to add **album**
  analytics. Plays are matched to your library by exact `Track Identifier`, which
  correctly attributes a song to the right album even when the same title appears
  on multiple releases (single vs. album, deluxe editions, etc.). Without it,
  everything except top-albums still works.

## Using

Follow [this guide from MacRumors](https://www.macrumors.com/2018/11/29/web-app-apple-music-history/) on how to download your data and use the site

## Getting Started

1. `git clone` this repo
2. `cd` into the folder
3. Run `npm install` and wait for the dependencies to install
4. Run `npm run start` to run the hot-reloading development server local. This runs at `localhost:3000`.

To build for production run `npm run build` and deploy the `/build` folder to your server.
