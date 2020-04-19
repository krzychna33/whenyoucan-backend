import express from "express";

import auth from "../middleware/authenticate";
import RequestWithUser from "../interfaces/RequestWithUser";
import {CalendarModel} from "../models/Calendar";
import {CreateCalendarDto} from "../interfaces/Calendar/CreateCalendarDto";
import mongoose from "mongoose";
import {ICalendar} from "../interfaces/Calendar/Calendar";
import {parse} from "dotenv";

const {ObjectId} = mongoose.Types;


export default class CalendarController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post('/', auth, this.createCalendar);

        this.router.get('/own', auth, this.getOwnCalendars);
        this.router.get('/connected', auth, this.getConnectedCalendars);

        this.router.get('/connected/:id', auth, this.getConnectedCalendar);
        this.router.get('/:id', auth, this.getOwnCalendar);

        this.router.post('/push-attendances/:id', auth, this.pushAttendances);
        this.router.post('/join/:id', auth, this.joinCalendar);
    }

    private async createCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body: CreateCalendarDto = req.body;

        const calendar = new CalendarModel({
            name: body.name,
            ownerId: req.user._id,
            pin: '1234',
            users: [req.user._id],
            reservedAttendances: {
                user: {
                    firstName: req.user.firstName,
                    _id: req.user._id
                },
                times: []
            }
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

    private async pushAttendances(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body = req.body;
        const {id} = req.params;

        try {
            const calendar = await CalendarModel.findOneAndUpdate(
                {_id: id, users: req.user._id},
                {$push: {"reservedAttendances.$[outer].times": {$each: body.times}}},
                {arrayFilters: [{"outer.user._id": req.user._id}]}
            );
            if (!calendar) {
                return res.status(404).send();
            }
            res.send(calendar);
        } catch (e) {
            res.send(400).send(e);
        }

    }

    private async joinCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body = req.body;
        const {id} = req.params;

        try {
            const calendar = await CalendarModel.findOne({_id: id});

            if (!calendar) {
                return res.status(404).send();
            }

            if (calendar.pin !== body.pin) {
                return res.status(401).send({
                    message: "Wrong pin"
                });
            }

            if (calendar.ownerId.toString() === req.user._id.toString()) {
                return res.status(400).send({
                    message: "You are owner of this calendar"
                });
            }

            if (calendar.users.includes(req.user._id)) {
                return res.status(400).send({
                    message: "You are already in this calendar."
                });
            }

            calendar.users.push(req.user._id);
            calendar.reservedAttendances.push({
                user: {
                    firstName: req.user.firstName,
                    _id: req.user._id
                },
                times: []
            });

            await calendar.save();
            res.send({
                message: `You joined to calendar with id: ${id}`
            });
        } catch (e) {
            res.status(400).send();
        }

    }

    private async getConnectedCalendars(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;

        try {
            let calendars = await CalendarModel.find({users: req.user._id, ownerId: {$ne: req.user._id}});
            const parsedCalendars = await calendars.map((calendar) => {
                return calendar.getPublic();
            });
            res.send(parsedCalendars);
        } catch (e) {
            res.status(400).send(e);
        }
    }

    private async getConnectedCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const {id} = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send();
        }

        try {
            const calendar = await CalendarModel.findOne({
                _id: id,
                users: req.user._id
            });

            if (!calendar) {
                return res.status(404).send({
                    message: "Not found"
                })
            }
            res.send(calendar.getPublic());
        } catch (e) {
            res.send(400).send(e);
        }
    }

}