#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

JAVA_HOME="/home/minecraft/graalvm"
NEOFORGE_COMMAND="$JAVA_HOME/bin/java @user_jvm_args.txt @libraries/net/neoforged/neoforge/21.1.216/unix_args.txt"

RUN_DIR="$SCRIPT_DIR/.run"
PID_FILE="$RUN_DIR/minecraft_server.pid"
WATCHDOG_PID_FILE="$RUN_DIR/watchdog.pid"
WATCHDOG_LOG="$RUN_DIR/watchdog.log"
WATCHDOG_STARTUP_GRACE_CHECKS=1
WATCHDOG_PING_TIMEOUT_MS=3000

SHUTDOWN_REQUESTED=0
SERVER_PROPERTIES="$SCRIPT_DIR/server.properties"
MODS_DIR="$SCRIPT_DIR/mods"
DISABLE_MODS_LIST="$SCRIPT_DIR/non-server-mods.list"

mkdir -p "$RUN_DIR"

disable_flagged_mods() {
	if [[ ! -f "$DISABLE_MODS_LIST" ]]; then
		return 0
	fi

	while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
		local line
		line="${raw_line%%#*}"
		line="${line%"${line##*[![:space:]]}"}"
		line="${line#"${line%%[![:space:]]*}"}"
		if [[ -z "$line" ]]; then
			continue
		fi

		local pattern
		if [[ "$line" == *.jar ]]; then
			pattern="$line"
		else
			pattern="${line}.jar"
		fi

		local matches=()
		local nullglob_was_set=0
		local jar_path
		local jar_name
		local IFS=$'\n'
		if shopt -q nullglob; then
			nullglob_was_set=1
		fi
		shopt -s nullglob
		for jar_path in "$MODS_DIR"/*.jar; do
			jar_name="$(basename "$jar_path")"
			if [[ "$jar_name" == $pattern ]]; then
				matches+=("$jar_path")
			fi
		done
		if [[ "$nullglob_was_set" -eq 0 ]]; then
			shopt -u nullglob
		fi

		if [[ "${#matches[@]}" -eq 0 ]]; then
			local disabled_pattern
			if [[ "$pattern" == *.jar ]]; then
				disabled_pattern="${pattern}.off"
			else
				disabled_pattern="${pattern}.jar.off"
			fi

			local disabled_matches=()
			local nullglob_off_was_set=0
			local disabled_path
			local disabled_name
			local IFS=$'\n'
			if shopt -q nullglob; then
				nullglob_off_was_set=1
			fi
			shopt -s nullglob
			for disabled_path in "$MODS_DIR"/*.jar.off; do
				disabled_name="$(basename "$disabled_path")"
				if [[ "$disabled_name" == $disabled_pattern ]]; then
					disabled_matches+=("$disabled_path")
				fi
			done
			if [[ "$nullglob_off_was_set" -eq 0 ]]; then
				shopt -u nullglob
			fi

			if [[ "${#disabled_matches[@]}" -gt 0 ]]; then
				echo "[$(date "+%Y-%m-%d %H:%M:%S")] Mod already disabled for pattern: ${disabled_pattern}"
				continue
			fi

			echo "[$(date "+%Y-%m-%d %H:%M:%S")] No mod found for pattern: ${pattern}"
			continue
		fi

		for match in "${matches[@]}"; do
			if [[ "$match" == *.jar ]]; then
				mv "$match" "${match}.off"
				echo "[$(date "+%Y-%m-%d %H:%M:%S")] Disabled mod: $(basename "$match")"
			fi
		done
	done < "$DISABLE_MODS_LIST"
}

start_watchdog() {
	if [[ -f "$WATCHDOG_PID_FILE" ]]; then
		local existing_pid
		existing_pid="$(cat "$WATCHDOG_PID_FILE" 2>/dev/null || true)"
		if [[ -n "${existing_pid}" ]] && kill -0 "${existing_pid}" 2>/dev/null; then
			return 0
		fi
	fi

	local watchdog_args=(
		--pid-file "$PID_FILE"
		--server-properties "$SERVER_PROPERTIES"
		--check-interval-seconds 60
		--down-threshold-minutes 3
		--soft-kill-timeout-seconds 60
		--startup-grace-checks "$WATCHDOG_STARTUP_GRACE_CHECKS"
		--ping-timeout-ms "$WATCHDOG_PING_TIMEOUT_MS"
	)
	node "$SCRIPT_DIR/watchdog.js" "${watchdog_args[@]}" \
		>> "$WATCHDOG_LOG" 2>&1 &

	echo $! > "$WATCHDOG_PID_FILE"
	sleep 1
	if ! kill -0 "$(cat "$WATCHDOG_PID_FILE" 2>/dev/null || true)" 2>/dev/null; then
		echo "[$(date "+%Y-%m-%d %H:%M:%S")] Watchdog failed to stay alive. Last log lines:" >&2
		tail -n 20 "$WATCHDOG_LOG" 2>/dev/null || true
	fi
}

stop_watchdog() {
	if [[ -f "$WATCHDOG_PID_FILE" ]]; then
		local existing_pid
		existing_pid="$(cat "$WATCHDOG_PID_FILE" 2>/dev/null || true)"
		if [[ -n "${existing_pid}" ]] && kill -0 "${existing_pid}" 2>/dev/null; then
			kill "${existing_pid}" 2>/dev/null || true
		fi
		rm -f "$WATCHDOG_PID_FILE"
	fi
}

cleanup() {
	stop_watchdog
}

handle_sigint() {
	if [[ "$SHUTDOWN_REQUESTED" -eq 0 ]]; then
		SHUTDOWN_REQUESTED=1
		echo "[$(date "+%Y-%m-%d %H:%M:%S")] Shutdown requested. Waiting for server to stop (watchdog active). Press Ctrl-C again to force exit."
		return
	fi
	echo "[$(date "+%Y-%m-%d %H:%M:%S")] Force exiting; stopping watchdog."
	exit 130
}

trap handle_sigint INT
trap cleanup EXIT

disable_flagged_mods
start_watchdog

while true; do
	if [[ "$SHUTDOWN_REQUESTED" -eq 1 ]]; then
		break
	fi

	echo "-------------------------------------------------------------------------"
	echo "[$(date "+%Y-%m-%d %H:%M:%S")] Starting Minecraft Server..."
	echo "-------------------------------------------------------------------------"

	bash -c "echo \$\$ > \"$PID_FILE\"; exec nice -n 1 $NEOFORGE_COMMAND \"\$@\"" -- "$@" || true
	rm -f "$PID_FILE"

	if [[ "$SHUTDOWN_REQUESTED" -eq 1 ]]; then
		echo "[$(date "+%Y-%m-%d %H:%M:%S")] Shutdown complete."
		break
	fi

	echo "-------------------------------------------------------------------------"
	echo "[$(date "+%Y-%m-%d %H:%M:%S")] Minecraft Server terminated, restarting..."
	echo "-------------------------------------------------------------------------"
	sleep 5

done
