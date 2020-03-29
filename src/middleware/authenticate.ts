import UserModel, {IUserSchema} from "../models/User";
import express from "express"
import RequestWithUser from "../Interfaces/RequestWithUser";


const authenticate = (req: RequestWithUser, res: express.Response, next: express.NextFunction) => {
    const token = req.header('x-auth') as string;

    UserModel.findByToken(token).then((user: IUserSchema) =>{
        if(!user){
            return Promise.reject('User not found!');
        }

        req.user = user;
        req.token = token;
        next();
    }).catch((e: any) =>{
        res.status(401).send({
            message: e
        });
    })
};

export default authenticate;