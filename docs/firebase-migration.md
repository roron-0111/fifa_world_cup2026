# Firebase Migration Plan

This project is currently running as a local Node server with JSON persistence.
The Firebase migration will keep the UI behavior but replace the persistence layer.

## Goal

- Serve the single-page app from Firebase Hosting.
- Store room, user, prediction, result, lock, and settings data in Firestore.
- Use Cloud Functions for scheduled result sync and kickoff locking later.

## Suggested data model

### `rooms/{roomId}`

- `code`
- `maxMembers`
- `members`
- `createdAt`
- `updatedAt`

### `users/{userId}`

- `username`
- `memberCode`
- `roomId`
- `isGuest`
- `lastSeenAt`

### `rooms/{roomId}/state/main`

- `predictionsV2`
- `results`
- `locked`
- `koPreds`
- `settings`

### `rooms/{roomId}/playerOverrides/{userId}`

- `players`
- `deletedIds`
- `additionsByCountry`
- `updatedAt`

## Migration phases

1. Keep the current local app working.
2. Add Firebase Hosting config and deploy the static page.
3. Move room/user state to Firestore.
4. Move auto-lock and auto-result sync to Cloud Functions.
5. Remove the local JSON server after the Firebase path is stable.

## Notes

- The current local server uses JSON files, which are fine for development.
- For production, the Firebase path should become the source of truth.
- Guest mode should stay device-local unless explicitly synced later.
