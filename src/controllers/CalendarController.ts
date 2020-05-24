import express from "express";

import {forceAuth, auth} from "../middleware/authenticate";
import RequestWithUser from "../interfaces/RequestWithUser";
import {CalendarModel} from "../models/Calendar";
import {CreateCalendarDto} from "../interfaces/Calendar/CreateCalendarDto";
import mongoose from "mongoose";

const {ObjectId} = mongoose.Types;

import {calendarEventEmitter} from "../events/calendarEvents"
import {EVENT_TYPE_NEW_ATTENDANCE} from "../events/eventTypes.const";


export default class CalendarController {

    public router: express.Router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.post('/', forceAuth, this.createCalendar);

        this.router.get('/own', forceAuth, this.getOwnCalendars);
        this.router.get('/connected', forceAuth, this.getConnectedCalendars);

        this.router.get('/:id/users', auth, this.getCalendarConnectedUsers);
        this.router.get('/:id', auth, this.getCalendar);

        this.router.post('/push-attendances/:id', forceAuth, this.pushAttendances);
        this.router.post('/join/:id', forceAuth, this.joinCalendar);

        this.router.get('/disconnect/:id', forceAuth, this.disconnectCalendar);
        this.router.delete('/:id', forceAuth, this.deleteCalendar);
    }

    private async createCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body: CreateCalendarDto = req.body;

        const calendar = new CalendarModel({
            name: body.name,
            ownerId: req.user._id,
            pin: body.pin ? body.pin : "",
            description: body.description ? body.description : "",
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

    private async getCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const {id} = req.params;
        console.log("AU")

        if (!ObjectId.isValid(id)) {
            return res.status(400).send();
        }

        try {
            const calendar = await CalendarModel.findOne({
                _id: id
            });

            if (!calendar) {
                return res.status(404).send({
                    message: "Not found"
                })
            }

            if (!req.user) {
                return res.send(calendar.getPublic());
            }

            if (req.user && req.user._id.toString() === calendar.ownerId.toString()) {
                return res.send(calendar)
            }

            const isUserConnected = calendar.reservedAttendances.findIndex((item) => {
                if (item.user._id.toString() === req.user._id.toString()) {
                    return item;
                }
            });

            if (isUserConnected !== -1) {
                return res.send(calendar.getConnected());
            }

            res.send(calendar.getPublic());
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
            calendarEventEmitter.emit(EVENT_TYPE_NEW_ATTENDANCE, {calendarId: id, userId: req.user.id})
            res.send(calendar);
        } catch (e) {
            res.send(400).send({
                message: e.message,
                errors: e.errors
            });
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
            res.status(400).send({
                message: e.message,
                errors: e.errors
            });
        }

    }

    private async getConnectedCalendars(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;

        try {
            let calendars = await CalendarModel.find({users: req.user._id, ownerId: {$ne: req.user._id}});
            const parsedCalendars = await calendars.map((calendar) => {
                return calendar.getConnected();
            });
            res.send({
                results: parsedCalendars
            });
        } catch (e) {
            res.status(400).send({
                message: e.message,
                errors: e.errors
            });
        }
    }

    public async getCalendarConnectedUsers(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const {id} = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send();
        }

        try {
            const calendar = await CalendarModel.findOne({
                _id: id
            });

            if (!calendar) {
                return res.status(404).send();
            }

            const connectedUsers = await calendar.getConnectedUsers();

            return res.send({
                results: connectedUsers
            });

        } catch (e) {
            res.status(400).send({
                message: e.message,
                errors: e.errors
            });
        }
    }

    private async disconnectCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const body = req.body;
        const {id} = req.params;

        try {
            const calendar = await CalendarModel.findOne({_id: id});

            if (!calendar) {
                return res.status(404).send();
            }

            if (calendar.ownerId.toString() === req.user._id.toString()) {
                return res.status(400).send({
                    message: "You are owner of this calendar"
                });
            }

            if (!calendar.users.includes(req.user._id)) {
                return res.status(400).send({
                    message: "You are not in this calendar."
                });
            }

            calendar.users = calendar.users.filter((user: any) => {
                if (user._id.toString() != req.user._id.toString()) {
                    return user;
                }
            });

            calendar.reservedAttendances = calendar.reservedAttendances.filter((attendance) => {
                if (req.user._id.toString() != attendance.user._id.toString()) {
                    return attendance;
                }
            })
            await calendar.save();
            res.send({
                message: `You has left calendar`
            });
        } catch (e) {
            res.status(400).send({
                message: e.message,
                errors: e.errors
            });
        }
    }

    private async deleteCalendar(expressRequest: express.Request, res: express.Response) {
        const req = expressRequest as RequestWithUser;
        const {id} = req.params;

        try {
            const deletedCalendar = await CalendarModel.findOneAndRemove({_id: id, ownerId: req.user._id});
            console.log(deletedCalendar)
            if (!deletedCalendar) {
                res.send({
                    message: "Calendar not found!",
                    errors: {}
                }).status(404)
            }
            res.send({
                message: "Deleted calendar",
                data: deletedCalendar
            })
        } catch (e) {
            res.send({
                message: e.message,
                errors: e.errors
            }).status(400)
        }
    }
}