export class AppError extends Error {

    public readonly message: string;
    public readonly errors?: any;
    public readonly status: number;

    constructor(message: string, status: number = 400, errors: any = {}) {
        super(message);
        this.message = message;
        this.errors = errors
        this.status = status;
    }
}