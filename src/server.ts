import {IOEventsListener} from "./events/IOEventsListener";

require('dotenv').config()

import express = require('express');
import * as bodyParser from "body-parser";
import cors from "cors";
import http, {Server} from "http";
import socketIO from "socket.io";
import AuthController from "./controllers/AuthController";
import mongoose from "mongoose";
import CalendarController from "./controllers/CalendarController";
import CalendarService from "./services/CalendarService"

const port = process.env.PORT || 3000;

class App {
    public app: express.Application;
    public server: Server;
    public io: socketIO.Server;
    public port: any;
    private IOEventsListener: IOEventsListener

    constructor(controllers: any[], port: any) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server);
        this.port = port;
        this.IOEventsListener = new IOEventsListener(this.io)

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
            //
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
        this.server.listen(this.port, () => {
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
        controller: new CalendarController(new CalendarService())
    }
], port);

app.listen();




