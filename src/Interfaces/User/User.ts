import {Document, Model} from "mongoose";
import AuthTokenInterface from "../AuthTokenInterface";

export interface IUser extends Document{
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    generateAuthToken(): string,
    removeToken(): IUser,
    tokens: AuthTokenInterface[]
}

export interface IUserSchema extends Model<IUser>{
    findByToken(token: any): any,
    findByCredentials(email: string, password: string): Promise<IUser>
}