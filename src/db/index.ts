import { drizzle } from "drizzle-orm/node-postgres";
import schema from "@/db/schema";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL || "",
    ssl: true,
  },
  casing: "snake_case",
  schema,
});
