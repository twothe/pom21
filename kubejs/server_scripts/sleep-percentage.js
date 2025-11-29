// Set playersSleepingPercentage=1 ONLY once per world using vanilla storage as guard.
// MC 1.21.1 · NeoForge · KubeJS 2101.7.1

ServerEvents.loaded(e => {
  e.server.runCommandSilent('execute unless data storage pom:init sleep_init run gamerule playersSleepingPercentage 1');
  e.server.runCommandSilent('execute unless data storage pom:init sleep_init run data modify storage pom:init sleep_init set value 1b');
});
