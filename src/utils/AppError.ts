export class AppError extends Error {

    public readonly message: string;
    public readonly errors: string[];

    constructor(message: string, errors?: string[]) {
        super(message);
        this.message = message;
        this.errors = []
    }

}