import express = require('express');
import * as bodyParser from "body-parser";

import AuthController from "./controllers/AuthController";

import mongoose from "mongoose";

class App {
    public app: express.Application;
    public port: any;

    constructor(controllers: any[], port: any) {
        this.app = express();
        this.port = port;

        this.initMiddleware();
        this.initControllers(controllers);
        this.connectWithDatabase();
    }

    private initMiddleware() {
        this.app.use(bodyParser.json());
    }

    private initControllers(controllers: any[]) {
        controllers.forEach((controller) => {
            this.app.use(controller.route, controller.controller.router)
        })
    }

    private connectWithDatabase() {
        mongoose.connect(`mongodb://localhost:27017/wyc`, {
            useNewUrlParser: true
        });
    }


    public listen() {
        this.app.listen(this.port,() => {
            console.log(`[APP] Running on port ${this.port}`);
        });
    }
}

const app: App = new App([
    {
        route: "/auth",
        controller: new AuthController()
    }], 3000);

app.listen();




