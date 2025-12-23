# Mod Disable List

## Purpose
Allow selectively disabling server-incompatible mods by renaming matching `.jar` files to `.jar.off` before the server starts.

## Usage
- Edit `non-server-mods.list`.
- Add one wildcard pattern per line (matched as `<pattern>.jar`).
- Empty lines and `#` comments are ignored.

## Example
- `Pretty Rain*` disables any `Pretty Rain*.jar` in the `mods` folder.

## Behavior
- Only files in `./mods` are considered.
- Matching `.jar` files are renamed to `.jar.off`.
- Already-disabled files are ignored.
