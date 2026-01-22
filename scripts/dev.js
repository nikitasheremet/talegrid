const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Create mongodb-data directory if it doesn't exist
const mongoDataDir = path.join(__dirname, "..", "mongodb-data");
if (!fs.existsSync(mongoDataDir)) {
  fs.mkdirSync(mongoDataDir, { recursive: true });
}

console.log("Starting MongoDB and Next.js dev server...\n");

// Start MongoDB
const mongod = spawn("mongod", ["--dbpath", mongoDataDir], {
  stdio: "inherit",
  shell: true,
});

// Give MongoDB a moment to start, then start Next.js
setTimeout(() => {
  const nextDev = spawn("next", ["dev"], {
    stdio: "inherit",
    shell: true,
  });

  // Handle cleanup on exit
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    nextDev.kill();
    mongod.kill();
    process.exit(0);
  });

  mongod.on("error", (err) => {
    console.error("Failed to start MongoDB:", err);
  });

  nextDev.on("error", (err) => {
    console.error("Failed to start Next.js:", err);
  });
}, 1000);
