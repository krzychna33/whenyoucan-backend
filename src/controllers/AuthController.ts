import express from "express";
import UserModel from "../models/User";
import * as _ from "lodash";
import {forceAuth} from "../middleware/authenticate";

import CreateUserDto from "../interfaces/User/CreateUserDto";
import RequestWithUser from "../interfaces/RequestWithUser";
import axios from "axios";
import generator from "generate-password";


export default class AuthController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post('/register', this.registerUser);
        this.router.get("/me", forceAuth, this.showUser);
        this.router.post('/login', this.handleLogin);
        this.router.post('/facebook-login', this.handleFacebookLogin);
        this.router.delete('/logout', forceAuth, this.handleLogout);
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
            res.status(400).send({message: e});
        }
    }

    private async handleFacebookLogin(req: express.Request, res: express.Response) {
        const {access_token, user_id} = req.body;
        try {
            const response = await axios.get(`https://graph.facebook.com/${user_id}?fields=id,name,email&access_token=${access_token}`)
            const user = await UserModel.findOne({email: response.data.email});
            if (user) {
                if (user.facebookId === user_id) {
                    const token = await user.generateAuthToken();
                    res.send({
                        token
                    })
                } else {
                    throw new Error("Email is taken");
                }
            } else {
                const [firstName, lastName] = response.data.name.split(" ");
                const newUser = new UserModel({
                    email: response.data.email,
                    firstName,
                    lastName,
                    password: generator.generate({length: 16, numbers: true}),
                    facebookId: user_id
                })
                const savedUser = await newUser.save();
                if (!savedUser) {
                    throw new Error("Failed while saving user to the database.")
                }
                const token = await savedUser.generateAuthToken();
                res.send({
                    token
                });
            }
        } catch (e) {
            res.status(400).send({message: e.message});
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
        res.send(req.user.getPublic())
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