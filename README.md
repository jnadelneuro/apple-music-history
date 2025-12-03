[![Netlify Status](https://api.netlify.com/api/v1/badges/8b888380-b867-4870-91c8-04ebdf823036/deploy-status)](https://app.netlify.com/sites/awesome-agnesi-2f5b8f/deploys)

> **Warning**
> With the release of Apple's native tool for music history, I've decided to retire the tool as it is stuck in dependency hell. Feel free to fork and bring it up to date if you wish, but don't expect it to work with any Apple data exports after 2022-01-01.

# [Apple Music History](https://music.patmurray.co)

Client React app to get info from your apple music history

Read more [on Pat Murray's site](https://patmurray.co/projects/apple-music-analyser/)

## Features

- 📊 Analyze your Apple Music play history from CSV exports
- 🎵 **NEW: Track Matching** - Match plays to library tracks and identify songs with multiple versions
- 📈 Detailed statistics on plays, artists, and listening patterns
- 📅 Calendar heatmaps and time-based analysis
- 🔒 Privacy-focused: All processing happens in your browser

### Track Matching (New!)

The app now includes track matching functionality that:
- Matches play activity to your Apple Music library by song name
- Flags **uncertain matches** when a song name appears **2 or more times** in your library
- Helps identify different versions (remasters, live recordings, etc.)
- See [TRACK_MATCHING.md](TRACK_MATCHING.md) for detailed documentation

## Using

Follow [this guide from MacRumors](https://www.macrumors.com/2018/11/29/web-app-apple-music-history/) on how to download your data and use the site

## Getting Started

1. `git clone` this repo
2. `cd` into the folder
3. Run `npm install` and wait for the dependencies to install
4. Run `npm run start` to run the hot-reloading development server local. This runs at `localhost:3000`.

To build for production run `npm run build` and deploy the `/build` folder to your server.
