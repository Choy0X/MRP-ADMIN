# MRP-ADMIN

Admin Menu for PHOENIX-RP Core

Overview
--------
MRP-ADMIN is an admin menu resource for FiveM designed to integrate with the PHOENIX-RP Core. It provides server administrators and staff with common moderation and server-management tools (teleport, noclip, revive, spawn vehicles, player management, announcements, etc.) through commands and an in-game menu.

This README is a starter; update commands/exports/config examples below to match the actual implementation in your repo.

Features (common)
-----------------
- In-game admin menu (keybind or command)
- Admin-only commands: teleport, bring, goto, noclip, freeze, spectate, heal/revive
- Vehicle management: spawn, delete, fix
- Player moderation: kick, ban, unban, tempban
- Announcements and server broadcast
- Permission-based access (ACE groups or PHOENIX-RP role checks)
- Configurable keybinds and permissions
- Exports and events for integration with other resources

Requirements
------------
- FiveM server
- PHOENIX-RP Core (script is designed to integrate with PHOENIX-RP Core — ensure compatibility with your core version)
- Node/JS runtime is not required on the server; this is a FiveM resource (JavaScript/Client & Server runtime in FiveM)
- Ensure fxmanifest.lua is present and correct

Installation
------------
1. Place the `mrp-admin` folder into your server `resources` directory.
2. Ensure the resource folder name matches what you'll start (e.g., `mrp-admin`).
3. Add the resource to `server.cfg`:
   ```cfg
   ensure mrp-admin
   ```
4. Restart your server (or start the resource).

Configuration
-------------
Open `config.lua` (or `config/default.js`) and edit the settings. Typical configuration options:

- Admin roles/groups (ACE group or PHOENIX-RP permissions)
- Keybind to open the menu
- Command prefixes and which commands are enabled
- Default ban durations / ban storage settings
- Toggle which features are available to which admin ranks

Example (pseudo) `config.lua`:
```lua
Config = {}
Config.AdminGroup = "admin"          -- group name used by ACE or core permissions
Config.MenuKey = "F2"                -- key to open admin menu
Config.Commands = {
  noclip = true,
  teleport = true,
  revive = true,
  spawnVehicle = true
}
```

Permissions
-----------
This resource supports permission checks. Two common approaches:

1. ACE permissions (server.cfg)
   ```cfg
   add_ace group.admin command allow
   add_principal identifier.steam:1100001a2b3c4d group.admin
   ```
   Replace the Steam identifier with the correct identifier for the admin account(s).

2. Core-based roles
   If PHOENIX-RP Core implements a role/permission system with an export (e.g., `exports['phoenix-core']:IsPlayerAdmin(source)`), update `config.lua` or the permission checks inside the resource to call those exports.

Commands (examples)
-------------------
Below are example commands — replace with actual commands implemented in your code.

- /admin — open admin menu
- /noclip — toggle noclip
- /tp [id/x y z] — teleport to player or coordinates
- /bring [id] — bring player to you
- /goto [id] — go to player
- /revive [id] — revive player
- /heal [id] — heal player
- /spawnveh [model] — spawn a vehicle
- /dv — delete vehicle
- /kick [id] [reason]
- /ban [id] [reason] [duration]
- /announce [message]

Usage examples
--------------
Open the menu (example):
```
/admin
```

Teleport to player:
```
/tp 23
```

Spawn a vehicle:
```
/spawnveh comet
```

Exposed events & exports
------------------------
(Provide exact names from your script here. Below are typical example signatures.)

Exports:
- `exports['mrp-admin']:OpenAdminMenu(source)` — open the admin menu for source
- `exports['mrp-admin']:IsAdmin(source)` — returns boolean if source is admin

Events:
- `mrp-admin:server:BanPlayer` — payload: {target, reason, duration}
- `mrp-admin:server:KickPlayer` — payload: {target, reason}
- `mrp-admin:client:OpenMenu` — opens the client admin UI

Update this section to match your actual export/event names and signatures.

Data storage
------------
If bans/notes are persistent, describe where they are stored:
- JSON file in the resource folder (e.g., `data/bans.json`) — show path and backup recommendations
- Or external database (MySQL/SQLite) — include required DB schema and any dependencies like ghmattimysql or oxmysql

Troubleshooting
---------------
- Admin menu not opening:
  - Ensure the resource is started (`ensure mrp-admin`) and no fxmanifest errors on server start.
  - Check your console for errors about missing exports or undefined functions — this indicates a mismatch with PHOENIX-RP Core exports.
  - Verify permission checks in `config.lua` or server.cfg.

- Commands not recognized:
  - Ensure no conflicts with other resources for command names.
  - Check server console to confirm commands were registered without errors.

- Bans not persisting:
  - Confirm the resource has write permissions (if using file storage).
  - If using a DB, ensure the DB connection is configured and the resource has any required DB dependency installed.

Contributing
------------
Contributions are welcome. Please:
1. Open an issue describing the change/bug.
2. Fork the repo and create a feature branch.
3. Create a PR with a clear description of changes and any migration steps.
4. Add tests or state manual test steps.

Recommended PR checklist:
- Code formatting and linting
- No console errors/warnings
- Updated README with new commands/config
- Backwards-compatible changes or clear migration notes

Security & Best Practices
-------------------------
- Limit admin access to trusted accounts.
- If using ACE, prefer Steam identifiers or other identity provider identifiers rather than IP.
- Sanitize any inputs for commands or server console usage.
- Regularly backup ban/permission data.
