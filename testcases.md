# Test Scenarios

## Tidal Guardians Gateway
- Place and activate the crafted gate pearl to ensure the `kubejs:tidal_guardians` gateway (from `data/kubejs/gateways/gateways/tidal_guardians.json`) appears with the teal frame and medium footprint.
- Verify the first four waves spawn 4/5/6/7 Guardians respectively with progressively higher survivability and damage; confirm timers respect the configured setup/max durations.
- Confirm the fifth wave spawns exactly one Elder Guardian and that its boosted health, armor, knockback resistance, and damage output are noticeable compared to vanilla.
- After clearing the event, ensure rewards include multiple Guardian/Elder Guardian loot rolls plus the warm ocean ruin loot-table drop.

## Server Watchdog
- Start the server via `./start.sh` and confirm the watchdog writes `./.run/watchdog.log` with a startup line.
- Set `WATCHDOG_STARTUP_GRACE_CHECKS=2` in `start.sh` and confirm the watchdog skips two heartbeat checks after each server start.
- Remove or rename `server.properties`, start the server, and confirm the watchdog logs a waiting message until the file is created.
- Stop the server process manually and verify the watchdog does not attempt to kill when the PID file is absent.
- Press `Ctrl-C` while the server is stopping and confirm the watchdog remains active until shutdown completes; press `Ctrl-C` again to force exit.
- Block the server port (or stop the process without clearing the PID file) and confirm the watchdog sends SIGTERM after ~3 minutes of failed checks, then SIGKILL after 60 seconds if still running.
- Restore connectivity and confirm the downtime counter resets when the server becomes reachable again.

## Mod Disable List
- Add `Pretty Rain*` to `non-server-mods.list` and confirm `Pretty Rain*.jar` is renamed to `Pretty Rain*.jar.off` before server startup.
- Leave a pattern with no matching JAR and confirm a "No mod found" log line appears.
- Confirm already-disabled `.jar.off` files are not renamed again.
