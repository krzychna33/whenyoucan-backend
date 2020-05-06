import express = require('express');
import * as bodyParser from "body-parser";
import cors from "cors";
require('dotenv').config()
import AuthController from "./controllers/AuthController";

import mongoose from "mongoose";
import CalendarController from "./controllers/CalendarController";

class App {
    public app: express.Application;
    public port: any;

    constructor(controllers: any[], port: any) {
        this.app = express();
        this.port = port;

        this.loadConfig();
        this.initMiddleware();
        this.initControllers(controllers);
        this.connectWithDatabase();
    }

    private loadConfig() {
        const env = process.env.NODE_ENV || "development";
        console.log(`[APP] Loaded ${env} environment`);

        if (env === "development") {
            require('dotenv').config({path: ".env"});
        } else if (env === "test") {
            require('dotenv').config({path: ".env.test"});
        } else if (env === "production") {
            require('dotenv').config({path: ".env.prod"});
        }

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
        mongoose.connect(`${process.env.MONGODB_URI}`, {
            useNewUrlParser: true
        })
            .then(() => console.log("[APP] Connected with database ❤️"))
            .catch((e) => console.log(e));
    }

    public listen() {
        this.app.listen(this.port,() => {
            console.log(`[APP] Running on port ${this.port}`);
        });
    }
}

export const app: App = new App([
    {
        route: "/auth",
        controller: new AuthController()
    },
    {
        route: "/weekly-calendars",
        controller: new CalendarController()
    }
], 3000);

app.listen();




