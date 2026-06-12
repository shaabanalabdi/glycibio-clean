export class Entity {

    id = null

    constructor(entity) {
        if (entity) {
            Object.assign(this, entity)
        }

        return this
    }

}
