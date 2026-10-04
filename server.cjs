// server.cjs - Root entrypoint for Hostinger / Phusion Passenger / PM2
// Seamlessly delegates to the compiled production bundle in dist/server.cjs
const path = require("path");
const fs = require("fs");

const distServer = path.join(__dirname, "dist", "server.cjs");
if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  console.error("dist/server.cjs not found. Please ensure 'npm run build' has completed.");
  process.exit(1);
}
