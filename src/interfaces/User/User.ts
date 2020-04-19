import {Document, Model} from "mongoose";
import AuthTokenInterface from "../AuthTokenInterface";

export interface IUserEntity {
    _id: any,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tokens: AuthTokenInterface[]
}

export interface IUser extends Document, IUserEntity{
    generateAuthToken(): string,
    removeToken(): IUser
}

export interface IUserSchema extends Model<IUser>{
    findByToken(token: any): any,
    findByCredentials(email: string, password: string): Promise<IUser>
}