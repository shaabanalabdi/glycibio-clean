import {db} from "./database.js";

export class Repository {
    constructor(entityClass, table = entityClass.name.toLowerCase()) {
        this.entityClass = entityClass
        this.table = table

        return this
    }

    find = async (id) => {
        const [rows] = await db.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id])
        return rows.length === 0 ? null : Object.assign(new this.entityClass(), rows[0])
    }

    findOneBy = async (constraints) => {
        const strConstraints = Object.keys(constraints)
            .map((key) => `${key} = ?`)
            .join(" AND ")
        const values = []

        Object.values(constraints).forEach((value) => {
            if (typeof value !== "function") values.push(value)
        })

        const [rows] = await db.query(`SELECT * FROM ${this.table} WHERE ${strConstraints} LIMIT 1`, values)

        return rows.length === 0 ? null : Object.assign(new this.entityClass(), rows[0])
    }

    findAll = async () => {
        const [rows] = await db.query(`SELECT * FROM ${this.table}`, [])

        return rows.map((row) => Object.assign(new this.entityClass(), row))
    }

    save = async (entity) => {

        let columns = Object.keys(entity)

        const isUpdate = !!entity.id

        if (isUpdate) {
            columns = columns.filter((col) => col !== "id")
            const updates = columns.map((col) => `${col} = ?`).join(", ")
            const values = columns.map((col) => entity[col])

            values.push(entity.id)

            const [result] = await db.query(`UPDATE ${this.table} SET ${updates} WHERE id = ?`, values)

            return result.insertId || entity.id
        } else {
            const columnNames = columns.filter((col) => col !== "id").map((col) => "`" + col + "`")
            const values = columns
                .filter((col) => col !== "id")
                .map((key) => entity[key])

            const placeholders = columnNames.map(() => "?").join(", ")

            const [result] = await db.query(
                `INSERT INTO ${"`" + this.table + "`"} (${columnNames.join(", ")}) VALUES (${placeholders})`,
                values
            )

            return result.insertId
        }
    }

    delete = async (id) => {
        await db.query(`DELETE FROM ${this.table} WHERE id = ?`, [id])
    }
}
