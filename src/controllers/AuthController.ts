import express from "express";
import UserModel from "../models/User";
import * as _ from "lodash";
import auth from "../middleware/authenticate";

import CreateUserDto from "../Interfaces/User/CreateUserDto";
import RequestWithUser from "../Interfaces/RequestWithUser";

export default class AuthController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post('/register', this.registerUser);
        this.router.get("/me", auth, this.showUser);
        this.router.post('/login', this.handleLogin);
        this.router.delete('/logout', auth, this.handleLogout);
    }

    private async handleLogin(req: express.Request, res: express.Response) {
        const body = _.pick(req.body, ['email', 'password']);

        try {
            const user = await UserModel.findByCredentials(body.email, body.password);
            const token = await user.generateAuthToken();
            res.send({
                token
            })
        } catch (e) {
            res.status(400).send(e);
        }
    }

    private async registerUser(req: express.Request, res: express.Response) {
        const userData: CreateUserDto = req.body;
        const newUser = new UserModel(userData);

        try {
            const savedUser = await newUser.save();
            const token = await savedUser.generateAuthToken();
            res.send({
                token
            });
        } catch (e) {
            res.status(400).send(e);
        }

    }

    private showUser(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        res.send({
            id: req.user._id.toString(),
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName
        })
    }

    private async handleLogout(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;

        try {
            await req.user.removeToken();
            res.send({
                message: "Logged out."
            })
        } catch (e) {
            res.status(400).send(e);
        }
    }
}