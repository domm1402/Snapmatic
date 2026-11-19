# Snapmatic

A mobile-first, GTA VI-inspired Snapmatic fan app. The feed mixes a long scroll of GTA VI promotional screenshots presented as fictional Snapmatic-style community posts with your own private photos.

## Feed
- 34 GTA VI image posts with fan-written Snapmatic-style captions, fictional usernames, locations and sample engagement counts.
- The GTA images are official promotional screenshots hosted by a third-party GTA VI image archive. They are not actual posts from the unreleased/in-game Snapmatic social network.
- Take photos or import pictures from your phone. Your uploads appear in the same feed.
- Likes and comments on sample GTA posts are saved locally on this device.
- Your own photos can be liked, commented on, edited, shared, exported and deleted.

## Camera
- GTA phone-camera-inspired HUD with location, time, live status, focus reticle and shutter controls.
- Front/rear camera switching, timer, flash/torch where supported, grid and looks/filters.
- Camera capture and image import.

## Local privacy
Your own photos, profile, likes and comments are stored in browser storage on this phone. They are not uploaded to a server or visible to other users. GTA sample images load from the internet. Clearing app/browser data can erase local photos, so export important pictures regularly.

## Android APK
A native Android WebView wrapper is included. Every push to `main` triggers **Build Snapmatic APK** in GitHub Actions. Open the repository's Actions tab, select the latest successful run and download the `Snapmatic-debug-apk` artifact. It contains `app-debug.apk`, which can be installed on Android after allowing installs from your browser/files app.

The APK build is a debug build, not a Play Store-signed release.

## Web app
Open the GitHub Pages HTTPS site in Chrome and install it from the browser menu. Camera access requires HTTPS or localhost.

## Image credits and fan-project notice
Grand Theft Auto VI screenshots remain the property of Rockstar Games. The screenshots are referenced from a public fan archive that identifies them as Rockstar-published promotional images. Captions, accounts and engagement counts in this app are fictional UI content. Snapmatic is an independent fan-made project and is not affiliated with or endorsed by Rockstar Games.
