export class BareConfigError extends Error {
    declare readonly name: "BareConfigError"

    constructor(message: string) {
        super(message)
        this.name = "BareConfigError"
    }
}
