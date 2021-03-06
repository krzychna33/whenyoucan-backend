import UserModel from "../models/User";
import express from "express"

import RequestWithUser from "../interfaces/RequestWithUser";
import {IUser} from "../interfaces/User/User";

export function forceAuth(expressRequest: express.Request, res: express.Response, next: express.NextFunction) {
    const req = expressRequest as RequestWithUser;
    const token = req.header('x-auth') as string;


    UserModel.findByToken(token).then((user: IUser) => {
        if (!user) {
            return Promise.reject('User not found!');
        }

        req.user = user;
        req.token = token;

        next();
    }).catch((e: any) => {
        res.status(e.status || 400).send({
            message: e.message,
            errors: e.errors
        });
    })
};

export function auth(expressRequest: express.Request, res: express.Response, next: express.NextFunction) {
    const req = expressRequest as RequestWithUser;
    const token = req.header('x-auth') as string;


    UserModel.findByToken(token).then((user: IUser) => {
        if (user) {
            req.user = user;
            req.token = token;
        }

        next();
    }).catch((e: any) => {
        if (e.message === "Unauthorized") {
            return next();
        }
        res.status(e.status || 400).send({
            message: e.message,
            errors: e.errors
        });
    })
}