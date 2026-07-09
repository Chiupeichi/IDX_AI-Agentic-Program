import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "idx_exchange",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const cleanParams = params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === "boolean") return p ? "True" : "False";
    return p;
  });

  console.log("PARAMS:", cleanParams);

  const [rows] = await pool.query(sql, cleanParams);
  return rows as T[];
}
