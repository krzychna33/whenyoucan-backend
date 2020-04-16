import express from "express";
import {IUser} from "./User/User";

export default interface RequestWithUser extends express.Request {
    user: IUser,
    token: string
}