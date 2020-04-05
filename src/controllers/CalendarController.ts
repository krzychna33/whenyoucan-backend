import express from "express";

import auth from "../middleware/authenticate";
import RequestWithUser from "../Interfaces/RequestWithUser";
import {CalendarModel} from "../models/Calendar";
import {CreateCalendarDto} from "../Interfaces/Calendar/CreateCalendarDto";
import mongoose from "mongoose";

const {ObjectId} = mongoose.Types


export default class CalendarController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post('/', auth, this.createCalendar);
        this.router.get('/own', auth, this.getOwnCalendars);
        this.router.get('/own/:id', auth, this.getOwnCalendar);
    }

    private async createCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body: CreateCalendarDto = req.body;

        const calendar = new CalendarModel({
            name: body.name,
            ownerId: req.user._id
        });

        try {
            const savedCalendar = await calendar.save();
            res.send(savedCalendar);
        } catch (e) {
            res.status(400).send(e);
        }
    }

    private async getOwnCalendars(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;

        try {
            const calendars = await CalendarModel.find({
                ownerId: req.user._id
            });
            res.send({
                results: calendars
            })
        } catch (e) {
            res.status(400).send(e);
        }

    }

    private async getOwnCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const {id} = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send();
        }

        try {
            const calendar = await CalendarModel.findOne({
                _id: id,
                ownerId: req.user._id
            });

            if (!calendar) {
                return res.status(404).send({
                    message: "Not found"
                })
            }

            res.send(calendar);
        } catch (e) {
            res.send(400).send(e);
        }


    }


}