export class AppError extends Error {

    public readonly message: string;
    public readonly errors?: any;

    constructor(message: string, errors: any = {}) {
        super(message);
        this.message = message;
        this.errors = errors
    }
}