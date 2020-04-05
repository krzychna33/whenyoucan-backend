import express = require('express');
import * as bodyParser from "body-parser";
import cors from "cors";

import AuthController from "./controllers/AuthController";

import mongoose from "mongoose";
import CalendarController from "./controllers/CalendarController";

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
        this.app.use(cors());
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
    },
    {
        route: "/calendars",
        controller: new CalendarController()
    }
], 3000);

app.listen();




