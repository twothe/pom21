# Server Watchdog

## Purpose
`start.sh` now launches a Node.js watchdog that monitors the Minecraft server TCP port and attempts a graceful shutdown if the server becomes unreachable for a sustained period.

## Behavior
- Reads `server-port` from `server.properties` in the instance root (waits until the file exists).
- Checks reachability on localhost every 60 seconds.
- Skips the first heartbeat check after server start (startup grace) by default (`--startup-grace-checks 1`).
- If the port is unreachable for 3 consecutive minutes, sends `SIGTERM` to the server PID.
- If the server is still running after 60 seconds, escalates to `SIGKILL`.
- Logs to `./.run/watchdog.log` and uses PID files under `./.run/`.
- `Ctrl-C` requests a graceful shutdown while the watchdog stays active; press `Ctrl-C` again to force exit.

## Files
- `start.sh`: bootstraps the server and watchdog, writes `./.run/minecraft_server.pid`.
- `watchdog.js`: Node.js watchdog implementation.
- `./.run/`: runtime directory for PID files and logs.
