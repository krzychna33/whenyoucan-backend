import express from "express";
import UserModel, {IUserSchema, UserDTO} from "../models/User";
import * as _ from "lodash";
import authenticate from "../middleware/authenticate";
import RequestWithUser from "../Interfaces/RequestWithUser";

export default class AuthController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/login', (req, res) => {
            res.send("LOGIN")
        });
        this.router.post('/register', this.registerUser);
        // @ts-ignore
        this.router.get("/me", authenticate, this.showUser);
        this.router.post('/login', this.handleLogin)
    }

    private handleLogin(req: express.Request, res: express.Response) {
        const body = _.pick(req.body, ['email', 'password']);

        UserModel.findByCredentials(body.email, body.password)
            .then((user) => {
                return user.generateAuthToken()
            })
            .then((token) => {
                res.send({
                    token
                })
            })
            .catch((e) => {
                res.status(400).send(e)
            })
    }

    private registerUser(req: express.Request, res: express.Response) {
        const userData: UserDTO = req.body;
        const newUser = new UserModel(userData);
        console.log(newUser)
        newUser.save()
            .then((user) => {
                return user.generateAuthToken();
            })
            .then((token) => {
                res.send({
                    token
                })
            })
            .catch((error) => {
                res.status(400).send(error);
            })
    }

    private showUser(req: RequestWithUser, res: express.Response) {
        res.send({
            email: req.user.email
        })
    }
}