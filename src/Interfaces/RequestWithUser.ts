import express from "express";
import {IUser} from "../models/User";

export default interface RequestWithUser extends express.Request {
    user: IUser,
    token: string
}