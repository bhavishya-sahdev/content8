import { drizzle } from "drizzle-orm/node-postgres";
import schema from "@/db/schema";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL || "",
    // SSL enabled in production by default (e.g. Neon).
    // Set DATABASE_SSL=false to disable for local postgres without SSL.
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : process.env.NODE_ENV === "production" ||
          process.env.DATABASE_SSL === "true",
  },
  casing: "snake_case",
  schema,
});
