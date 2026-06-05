import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

function createSafeViteRoot(sourceDir: string) {
  if (!sourceDir.includes("%")) {
    return sourceDir;
  }

  const aliasBase = path.join(os.tmpdir(), "careerpath-ai-vite-root");
  const aliasDir = path.join(aliasBase, "app");

  try {
    fs.mkdirSync(aliasBase, { recursive: true });
    if (!fs.existsSync(aliasDir)) {
      fs.symlinkSync(sourceDir, aliasDir, "junction");
    }
    process.chdir(aliasDir);
    return aliasDir;
  } catch {
    return sourceDir;
  }
}

function installSafeUriDecoders() {
  const originalDecodeURI = globalThis.decodeURI;
  const originalDecodeURIComponent = globalThis.decodeURIComponent;

  globalThis.decodeURI = ((value: string) => {
    try {
      return originalDecodeURI(value);
    } catch {
      return originalDecodeURI(value.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
    }
  }) as typeof decodeURI;

  globalThis.decodeURIComponent = ((value: string) => {
    try {
      return originalDecodeURIComponent(value);
    } catch {
      return originalDecodeURIComponent(value.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
    }
  }) as typeof decodeURIComponent;
}

const db = new Database(path.join(__dirname, "career_path.db"));

const ensureUserExistsStmt = db.prepare("INSERT OR IGNORE INTO users (id) VALUES (?)");

function ensureUserExists(userId: string) {
  ensureUserExistsStmt.run(userId);
}

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    current_role TEXT,
    target_role TEXT,
    interests TEXT,
    constraints TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    level INTEGER, -- 1-5
    validated BOOLEAN DEFAULT 0,
    source TEXT, -- 'resume', 'quiz', 'manual'
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    target_role TEXT,
    steps TEXT, -- JSON string
    status TEXT, -- 'active', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User Profile Endpoints
  app.post("/api/user", (req, res) => {
    const { id, email, name } = req.body;
    try {
      const stmt = db.prepare("INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)");
      stmt.run(id, email, name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/user/:id", (req, res) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
      const skills = db.prepare("SELECT * FROM skills WHERE user_id = ?").all(req.params.id);
      res.json({ ...user, skills });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/skills", (req, res) => {
    const { userId, skills } = req.body;
    try {
      if (!userId || !Array.isArray(skills)) {
        res.status(400).json({ error: "userId and skills are required" });
        return;
      }

      ensureUserExists(userId);

      const deleteStmt = db.prepare("DELETE FROM skills WHERE user_id = ?");
      deleteStmt.run(userId);

      const insertStmt = db.prepare("INSERT INTO skills (id, user_id, name, level, source) VALUES (?, ?, ?, ?, ?)");
      const transaction = db.transaction((skillsList) => {
        for (const skill of skillsList) {
          insertStmt.run(crypto.randomUUID(), userId, skill.name, skill.level, skill.source);
        }
      });
      transaction(skills);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/roadmap", (req, res) => {
    const { userId, targetRole, steps } = req.body;
    try {
      if (!userId || !targetRole || !Array.isArray(steps)) {
        res.status(400).json({ error: "userId, targetRole and steps are required" });
        return;
      }

      ensureUserExists(userId);

      const id = crypto.randomUUID();
      const stmt = db.prepare("INSERT OR REPLACE INTO roadmaps (id, user_id, target_role, steps, status) VALUES (?, ?, ?, ?, ?)");
      stmt.run(id, userId, targetRole, JSON.stringify(steps), 'active');
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/roadmap/:userId", (req, res) => {
    try {
      const roadmap = db.prepare("SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.userId);
      if (roadmap) {
        roadmap.steps = JSON.parse(roadmap.steps);
      }
      res.json(roadmap || null);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/roadmap/:id", (req, res) => {
    const { steps, status } = req.body;
    try {
      const stmt = db.prepare("UPDATE roadmaps SET steps = ?, status = ? WHERE id = ?");
      stmt.run(JSON.stringify(steps), status || 'active', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    installSafeUriDecoders();

    app.use((req, res, next) => {
      if (req.url?.includes("node_modules/vite/dist/client/env.mjs")) {
        res.type("application/javascript");
        res.send(`const context = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  } else if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();
const defines = {};
Object.keys(defines).forEach((key) => {
  const segments = key.split(".");
  let target = context;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i === segments.length - 1) {
      target[segment] = defines[key];
    } else {
      target = target[segment] || (target[segment] = {});
    }
  }
});`);
        return;
      }

      next();
    });

    app.use((req, _res, next) => {
      if (req.url?.includes("%")) {
        req.url = req.url.replace(/%/g, "%25");
      }
      next();
    });

    const vite = await createViteServer({
      root: createSafeViteRoot(__dirname),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
