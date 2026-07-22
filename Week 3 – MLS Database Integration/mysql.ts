import "dotenv/config";
import { execFileSync } from "node:child_process";
import mysql from "mysql2/promise";

function requireEnv(name: "MYSQL_USER" | "MYSQL_DATABASE") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Add it to the local .env file.`);
  }
  return value;
}

function resolvePassword(user: string) {
  const directPassword = process.env.MYSQL_PASSWORD?.trim();
  if (directPassword) {
    return directPassword;
  }

  const keychainService = process.env.MYSQL_PASSWORD_KEYCHAIN_SERVICE?.trim();
  if (process.platform === "darwin" && keychainService) {
    try {
      const password = execFileSync(
        "/usr/bin/security",
        ["find-generic-password", "-s", keychainService, "-a", user, "-w"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
      if (password) {
        return password;
      }
    } catch {
      // Fall through to the actionable error below.
    }
  }

  throw new Error(
    "MySQL password is missing. Set MYSQL_PASSWORD or configure the named macOS Keychain item."
  );
}

const port = Number(process.env.MYSQL_PORT || "3306");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("MYSQL_PORT must be a valid TCP port number.");
}

const user = requireEnv("MYSQL_USER");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port,
  user,
  password: resolvePassword(user),
  database: requireEnv("MYSQL_DATABASE"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(
  sql: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const cleanParams = params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === "boolean") return p ? "True" : "False";
    return p;
  });

  const [rows] = await pool.query(sql, cleanParams);
  return rows as T[];
}

export async function closePool() {
  await pool.end();
}
