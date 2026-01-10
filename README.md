# Keepster

A calm, iOS-first photo-cleaning session app built with Expo + React Native.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npx expo start --ios
   ```

## Required permissions (iOS)

- Photo Library access is required to load, add to albums, and delete photos.
- Ensure `NSPhotoLibraryUsageDescription` and `NSPhotoLibraryAddUsageDescription` are set in Expo config.

## Important iOS limitation

iOS albums are **collections**, not folders. "Move to album" in Keepster is implemented as **add to album**. The asset will still appear in Recents.

## Loose photo sessions

Keepster sessions show only photos that are **not in any user-created album**. Smart albums (Favorites, Screenshots, etc.) are excluded when building the "loose" list.

## Delete + undo behavior

- Swipe left removes the photo immediately from the UI.
- A single undoable delete is stored for **60 seconds**.
- Tapping Undo restores the photo to the front of the queue.
- If another delete happens while one is pending, the previous deletion is queued for commit.
- Deletes are committed in **batches** (and when you tap Done) via `MediaLibrary.deleteAssetsAsync` to reduce iOS confirmation prompts.
- Tap Done to finish a session and commit any queued deletions.

## Analysis (future scaffolding)

- Duplicate detection: Stage 1 groups by metadata (time, dimensions, filename). Stage 2 hashing is stubbed for future upgrades.
- Blurry detection: Placeholder interface with no heavy processing yet.
- Analysis runs in the background and never blocks swiping.

## Android notes

Android support is intentionally minimal for now. Permissions and album behavior will be updated in a future pass.
