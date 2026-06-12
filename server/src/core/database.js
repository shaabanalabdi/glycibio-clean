import mysql from "mysql2/promise"
import * as dotenv from "dotenv";

dotenv.config()

const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env

export const db = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
})

export const withTransaction = async (work) => {
    const connection = await db.getConnection()

    try
    {
        await connection.beginTransaction()
        const result = await work(connection)
        await connection.commit()

        return result
    }
    catch (error)
    {
        await connection.rollback()
        throw error
    }
    finally
    {
        connection.release()
    }
}
