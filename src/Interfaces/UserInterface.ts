import {Document} from "mongoose";
import AuthTokenInterface from "./AuthTokenInterface";

export default interface UserInterface extends Document{
    email: string,
    password: string,
    generateAuthToken(): string,
    findByToken(): any,
    tokens: AuthTokenInterface[]
}