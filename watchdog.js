#!/usr/bin/env node

"use strict";

const fs = require("fs");
const net = require("net");

process.on("SIGINT", () => {
	log("Ignoring SIGINT; watchdog is managed by start.sh.");
});

/**
 * Parses CLI arguments of the form --key value into a plain object.
 */
function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i += 1) {
		const current = argv[i];
		if (current.startsWith("--")) {
			const key = current.slice(2);
			const value = argv[i + 1];
			if (!value || value.startsWith("--")) {
				throw new Error(`Missing value for --${key}`);
			}
			args[key] = value;
			i += 1;
		}
	}
	return args;
}

/**
 * Reads the server port from a Minecraft server.properties file.
 */
function readServerPort(serverPropertiesPath) {
	if (!fs.existsSync(serverPropertiesPath)) {
		throw new Error(`server.properties not found at ${serverPropertiesPath}`);
	}

	const content = fs.readFileSync(serverPropertiesPath, "utf8");
	const lines = content.split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}
		const [key, value] = trimmed.split("=", 2);
		if (key === "server-port") {
			const port = Number.parseInt(value, 10);
			if (!Number.isInteger(port) || port <= 0 || port > 65535) {
				throw new Error(`Invalid server-port value: ${value}`);
			}
			return port;
		}
	}

	throw new Error("server-port not found in server.properties");
}

/**
 * Tests whether a TCP port is reachable on localhost within a timeout.
 */
function isPortReachable(port, timeoutMs) {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		let settled = false;

		const finish = (result) => {
			if (settled) {
				return;
			}
			settled = true;
			socket.destroy();
			resolve(result);
		};

		socket.setTimeout(timeoutMs);
		socket.once("connect", () => finish(true));
		socket.once("timeout", () => finish(false));
		socket.once("error", () => finish(false));
		socket.connect(port, "127.0.0.1");
	});
}

/**
 * Reads the server PID from a pid file and validates that it is running.
 */
function readServerPid(pidFilePath) {
	if (!fs.existsSync(pidFilePath)) {
		return null;
	}

	const pidText = fs.readFileSync(pidFilePath, "utf8").trim();
	if (!pidText) {
		return null;
	}

	const pid = Number.parseInt(pidText, 10);
	if (!Number.isInteger(pid) || pid <= 0) {
		return null;
	}

	try {
		process.kill(pid, 0);
		return pid;
	} catch (_error) {
		return null;
	}
}

/**
 * Terminates a process gracefully, then forcefully if needed.
 */
async function terminateProcess(pid, softKillTimeoutSeconds) {
	try {
		process.kill(pid, "SIGTERM");
	} catch (error) {
		log(`Failed to send SIGTERM to ${pid}: ${error.message}`);
		return;
	}

	const deadline = Date.now() + softKillTimeoutSeconds * 1000;
	while (Date.now() < deadline) {
		await delay(5000);
		try {
			process.kill(pid, 0);
		} catch (_error) {
			log(`Server PID ${pid} exited after SIGTERM.`);
			return;
		}
	}

	log(`Server PID ${pid} did not exit after ${softKillTimeoutSeconds}s, sending SIGKILL.`);
	try {
		process.kill(pid, "SIGKILL");
	} catch (error) {
		log(`Failed to send SIGKILL to ${pid}: ${error.message}`);
	}
}

/**
 * Returns a promise that resolves after the provided milliseconds.
 */
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Emits a timestamped log message.
 */
function log(message) {
	const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "Z");
	process.stdout.write(`[${timestamp}] ${message}\n`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const pidFile = args["pid-file"];
	const serverPropertiesPath = args["server-properties"];
	const checkIntervalSeconds = Number.parseInt(args["check-interval-seconds"], 10);
	const downThresholdMinutes = Number.parseInt(args["down-threshold-minutes"], 10);
	const softKillTimeoutSeconds = Number.parseInt(args["soft-kill-timeout-seconds"], 10);
	const startupGraceChecks = Number.parseInt(args["startup-grace-checks"] ?? "1", 10);
	const pingTimeoutMs = Number.parseInt(args["ping-timeout-ms"] ?? "3000", 10);

	if (!pidFile || !serverPropertiesPath) {
		throw new Error("--pid-file and --server-properties are required.");
	}

	if (!Number.isInteger(checkIntervalSeconds) || checkIntervalSeconds <= 0) {
		throw new Error("--check-interval-seconds must be a positive integer.");
	}
	if (!Number.isInteger(downThresholdMinutes) || downThresholdMinutes <= 0) {
		throw new Error("--down-threshold-minutes must be a positive integer.");
	}
	if (!Number.isInteger(softKillTimeoutSeconds) || softKillTimeoutSeconds <= 0) {
		throw new Error("--soft-kill-timeout-seconds must be a positive integer.");
	}
	if (!Number.isInteger(startupGraceChecks) || startupGraceChecks < 0) {
		throw new Error("--startup-grace-checks must be a non-negative integer.");
	}
	if (!Number.isInteger(pingTimeoutMs) || pingTimeoutMs <= 0) {
		throw new Error("--ping-timeout-ms must be a positive integer.");
	}

	let serverPort = null;
	let lastPortError = null;
	let lastPid = null;
	let graceRemaining = 0;

	const refreshServerPort = () => {
		try {
			const port = readServerPort(serverPropertiesPath);
			if (serverPort === null || serverPort !== port) {
				serverPort = port;
				log(`Watchdog using server-port ${serverPort}.`);
			}
			lastPortError = null;
		} catch (error) {
			const message = error.message;
			if (lastPortError !== message) {
				log(`Watchdog waiting for server.properties: ${message}`);
				lastPortError = message;
			}
		}
	};

	log(`Watchdog started (pid file: ${pidFile}).`);
	refreshServerPort();

	let downChecks = 0;
	let isTerminating = false;

	const checkIntervalMs = checkIntervalSeconds * 1000;
	const downThresholdCount = Math.ceil((downThresholdMinutes * 60) / checkIntervalSeconds);

	const check = async () => {
		if (isTerminating) {
			return;
		}

		const pid = readServerPid(pidFile);
		if (!pid) {
			downChecks = 0;
			graceRemaining = 0;
			lastPid = null;
			return;
		}

		if (pid !== lastPid) {
			lastPid = pid;
			graceRemaining = startupGraceChecks;
			if (graceRemaining > 0) {
				log(`Startup grace active (${graceRemaining} checks remaining).`);
			}
		}

		if (graceRemaining > 0) {
			graceRemaining -= 1;
			return;
		}

		if (serverPort === null) {
			refreshServerPort();
			log("Server port unavailable; skipping heartbeat check.");
			return;
		}

		const reachable = await isPortReachable(serverPort, pingTimeoutMs);
		if (reachable) {
			if (downChecks > 0) {
				log("Server reachable again; resetting downtime counter.");
			}
			downChecks = 0;
			return;
		}

		downChecks += 1;
		log(`Server unreachable (${downChecks}/${downThresholdCount} checks).`);
		if (downChecks < downThresholdCount) {
			return;
		}

		isTerminating = true;
		log(`Server unreachable for ${downThresholdMinutes} minutes; attempting SIGTERM.`);
		await terminateProcess(pid, softKillTimeoutSeconds);
		downChecks = 0;
		isTerminating = false;
	};

	const safeCheck = () => {
		check().catch((error) => {
			log(`Watchdog check failed: ${error.message}`);
		});
	};

	await check().catch((error) => {
		log(`Watchdog check failed: ${error.message}`);
	});
	setInterval(safeCheck, checkIntervalMs);
}

main().catch((error) => {
	process.stderr.write(`[FATAL] ${error.message}\n`);
	process.exit(1);
});
