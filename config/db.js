import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

export const db = new pg.Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});