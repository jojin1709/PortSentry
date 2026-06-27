const http = require("http");
const { exec } = require("child_process");
const os = require("os");

const PORT = 9977;
const platform = os.platform();

function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 8000 }, (err, stdout) => resolve(err ? "" : stdout));
  });
}

async function getServices() {
  let raw = "";
  if (platform === "win32") {
    raw = await runCmd(
      `netstat -ano -p TCP | findstr LISTENING`
    );
  } else {
    raw = await runCmd(
      `lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null || ss -tlnp 2>/dev/null`
    );
  }
  const services = parseServices(raw);

  // Fetch CPU and Memory usage using pidusage
  let pidusage;
  try {
    pidusage = require('pidusage');
  } catch (e) {
    return services;
  }

  const pids = [...new Set(services.map(s => s.pid).filter(Boolean))];
  const statsPromises = pids.map(async (pid) => {
    try {
      const stats = await pidusage(pid);
      return { pid, stats };
    } catch (e) {
      return { pid, stats: null };
    }
  });

  try {
    const statsResults = await Promise.all(statsPromises);
    const statsMap = {};
    for (const item of statsResults) {
      if (item.stats) {
        statsMap[item.pid] = item.stats;
      }
    }

    for (const s of services) {
      const stats = statsMap[s.pid];
      if (stats) {
        s.cpu = stats.cpu; // percentage
        s.mem = stats.memory; // bytes
      } else {
        s.cpu = 0;
        s.mem = 0;
      }
    }
    pidusage.clear(); // Clean up listeners to prevent memory leaks
  } catch (e) {
    console.error("Warning: failed to query pid usage:", e.message);
  }

  return services;
}

function parseServices(raw) {
  const services = {};
  const lines = raw.split("\n").filter(Boolean);

  if (platform === "win32") {
    for (const line of lines) {
      const m = line.match(/TCP\s+[\d.:]+:(\d+)\s+[\d.:]+\s+LISTENING\s+(\d+)/);
      if (!m) continue;
      const port = parseInt(m[1]);
      const pid = parseInt(m[2]);
      if (port < 1 || port > 65535) continue;
      if (!services[port]) services[port] = { port, pid, name: "", cmd: "" };
    }
    const names = {};
    let tasklist = "";
    try {
      tasklist = require("child_process").execSync("tasklist /fo csv /nh", { timeout: 10000 }).toString();
    } catch (e) {
      console.error("Warning: tasklist query failed or timed out: " + e.message);
    }
    for (const line of tasklist.split("\n")) {
      const m = line.match(/"([^"]+)","(\d+)"/);
      if (m) names[parseInt(m[2])] = m[1].replace(".exe", "");
    }
    for (const s of Object.values(services)) {
      s.name = names[s.pid] || "unknown";
      s.cmd = names[s.pid] || "";
    }
  } else {
    const useLsof = raw.includes("COMMAND");
    if (useLsof) {
      for (const line of lines) {
        if (line.startsWith("COMMAND")) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) continue;
        const name = parts[0];
        const pid = parseInt(parts[1]);
        const addrPart = parts[8] || "";
        const portMatch = addrPart.match(/:(\d+)$/);
        if (!portMatch) continue;
        const port = parseInt(portMatch[1]);
        if (port < 1 || port > 65535) continue;
        if (!services[port]) {
          services[port] = { port, pid, name, cmd: parts.slice(0, 1).join(" ") };
        }
      }
    } else {
      for (const line of lines) {
        if (line.startsWith("State")) continue;
        const parts = line.trim().split(/\s+/);
        const addrPart = parts[3] || parts[1] || "";
        const portMatch = addrPart.match(/:(\d+)$/);
        if (!portMatch) continue;
        const port = parseInt(portMatch[1]);
        if (port < 1 || port > 65535) continue;
        const pidMatch = line.match(/pid=(\d+)/);
        const nameMatch = line.match(/users:\(\("([^"]+)"/);
        const pid = pidMatch ? parseInt(pidMatch[1]) : 0;
        const name = nameMatch ? nameMatch[1] : "unknown";
        if (!services[port]) services[port] = { port, pid, name, cmd: name };
      }
    }

    for (const s of Object.values(services)) {
      if (s.pid && !s.cmd) {
        try {
          const c = require("child_process")
            .execSync(`ps -p ${s.pid} -o args= 2>/dev/null || cat /proc/${s.pid}/cmdline 2>/dev/null | tr '\\0' ' '`, { timeout: 2000 })
            .toString()
            .trim()
            .slice(0, 120);
          if (c) s.cmd = c;
        } catch (_) {}
      }
    }
  }

  return Object.values(services)
    .filter((s) => s.port !== PORT)
    .sort((a, b) => a.port - b.port);
}

async function killProcess(pid) {
  if (!pid) return { ok: false, msg: "No PID" };
  try {
    if (platform === "win32") {
      require("child_process").execSync(`taskkill /F /T /PID ${pid}`, { timeout: 3000 });
    } else {
      require("child_process").execSync(`kill -9 -${pid} 2>/dev/null || kill -9 ${pid}`, { timeout: 3000 });
    }
    return { ok: true, msg: `Killed process tree for PID ${pid}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.method === "GET" && req.url === "/services") {
    try {
      const services = await getServices();
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      return res.end(JSON.stringify({ services, platform }));
    } catch (err) {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (req.method === "POST" && req.url === "/kill") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const { pid } = JSON.parse(body || "{}");
      const result = await killProcess(pid);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(result.ok ? 200 : 400);
      res.end(JSON.stringify(result));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  PortSentry backend running at http://127.0.0.1:${PORT}`);
  console.log(`  Open portsentry.html in your browser\n`);
});

module.exports = { getServices };
