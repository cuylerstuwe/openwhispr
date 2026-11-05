# Whispr Personal for Windows

This personal desktop variant is based on cuylerstuwe/openwhispr at ed28e3cc22a4f831abd5cf7c31f4ea275fb76d3c. It retains the original MIT license and attribution. The Windows executable and install directory remain OpenWhispr so the existing installation and profile upgrade in place; the UI says Whispr Personal and the version is 1.11.1-personal.1.

## Personal behavior

- No company login, account bootstrap, subscription/quota polling, checkout, referral offers, or sidebar promotions.
- Company cloud modes, cloud backup, sync, analytics uploads, leaderboards, and activation telemetry are disabled. The sync implementation and authentication client have been removed from the desktop runtime.
- A main-process boundary rejects company IPC operations and requests to OpenWhispr/GizmoLabs domains in Electron, fetch, and Node HTTP clients. Direct provider requests remain available.
- No upstream update checks or automatic installation. Rebuild this variant to update it. The upstream authentication and updater packages are no longer desktop dependencies.
- The setup wizard has a Skip model setup action. AI cleanup is optional and stays off when skipped. A transcription model or endpoint is needed when you actually dictate.
- Local transcript/audio history and retention controls remain available. Existing settings, endpoint credentials, and history preferences are preserved.
- Insights reads device-local SQLite usage records directly: spoken words, measured speaking rate, dictation count, streaks, and activity heatmap. Empty profiles show real zeros. Aggregate usage is recorded even when saving transcript/audio content is disabled. Historical saved dictations are reconciled by the existing restart-safe local backfill. No account is required.

## Network behavior

Audio/text is sent to a server only when you choose a remote inference endpoint or a direct integration that needs it. A LAN/Tailscale Whisper-compatible server and direct provider keys remain supported. Public model downloads and optional direct calendar integrations still use the network. This is not an offline-only build.

The existing custom transcription configuration is kept, including its API key. No credentials are included in the source patch or installer. To configure a server requiring a key, choose Settings > Speech to Text > Cloud Providers > Custom, then enter its base URL, model, and key. The base URL should end in /v1 (the app appends /audio/transcriptions).

## Build

Use Node 24 or newer, install dependencies, and prepare native resources using the repository's Windows prebuild scripts. For an unsigned personal build:

    npm run typecheck
    npm run build:renderer
    npx electron-builder --config electron-builder.unsigned-win.json --win --x64 --publish never

For isolated testing, WHISPR_PERSONAL_DATA_DIR may point to a separate profile directory. Do not set it for ordinary use if you want your existing profile.

Database tests must run under an ABI-compatible Node/Electron runtime with REQUIRE_DB_TESTS=1 so they cannot silently skip. Focused coverage includes analyticsDatabase, analytics, personalBoundary, personalPreferences, and transcriptionBaseUrl.
