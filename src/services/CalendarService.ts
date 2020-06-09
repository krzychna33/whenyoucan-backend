import {CalendarModel} from "../models/Calendar";
import {IUser, IUserEntity} from "../interfaces/User/User";
import {CreateCalendarDto} from "../interfaces/Calendar/CreateCalendarDto";
import {AppError} from "../utils/AppError";
import mongoose from "mongoose";

const {ObjectId} = mongoose.Types;


export default class CalendarService {

    public createNewCalendar = async (body: CreateCalendarDto, user: IUser) => {

        const calendar = new CalendarModel({
            name: body.name,
            ownerId: user._id,
            pin: body.pin ? body.pin : "",
            expectedUsersCount: body.expectedUsersCount,
            description: body.description ? body.description : "",
            users: [user._id],
            reservedAttendances: {
                user: {
                    firstName: user.firstName,
                    _id: user._id
                },
                times: []
            }
        });

        try {
            return await calendar.save();
        } catch (e) {
            throw new AppError(e.message, 400, e.errors);
        }
    }

    public getOwnCalendars = async (userId: string) => {
        try {
            return await CalendarModel.find({
                ownerId: userId
            });
        } catch (e) {
            throw new AppError(e.message, 400, e.errors)
        }
    }

    public updateUserAttendances = async (userId: string, calendarId: string, times: any) => {

        if (!ObjectId.isValid(calendarId)) {
            throw new AppError('Calendar id is not valid ObjectId!', 500);
        }

        try {
            const calendar = await CalendarModel.findOneAndUpdate(
                {_id: calendarId, users: userId},
                {$set: {"reservedAttendances.$[outer].times": times}},
                {arrayFilters: [{"outer.user._id": userId}]}
            );

            if (!calendar) {
                throw new AppError('Calendar not found!', 404)
            }

            return calendar;

        } catch (e) {
            throw new AppError(e.message, e.status, e.errors)
        }
    }

    public getCalendarWithCorrectPermissions = async (user: IUser, calendarId: string) => {
        if (!ObjectId.isValid(calendarId)) {
            throw new AppError("Invalid CalendarId", 404);
        }

        try {
            const calendar = await CalendarModel.findOne({
                _id: calendarId
            });

            if (!calendar) {
                throw new AppError("Calendar with this id not found!", 404);
            }

            if (!user) {
                return calendar.getPublic();
            }

            if (user && user._id.toString() === calendar.ownerId.toString()) {
                return calendar;
            }

            const isUserConnected = calendar.reservedAttendances.findIndex((item) => {
                if (item.user._id.toString() === user._id.toString()) {
                    return item;
                }
            });

            if (isUserConnected !== -1) {
                return calendar.getConnected();
            }

            return calendar.getPublic();
        } catch (e) {
            throw new AppError(e.message, e.status, e.errors);
        }
    }

    public joinToCalendar = async (user: IUserEntity, pin: string, calendarId: string) => {

        try {
            const calendar = await CalendarModel.findOne({_id: calendarId});

            if (!calendar) {
                throw new AppError("Calendar with this id not found!", 404);
            }

            if (calendar.pin !== pin) {
                throw new AppError("PIN is wrong", 401);
            }

            if (calendar.ownerId.toString() === user._id.toString()) {
                throw new AppError("You are owner of this calendar", 400);
            }

            if (calendar.users.includes(user._id)) {
                throw new AppError("You are already in this calendar", 400);
            }

            calendar.users.push(user._id);
            calendar.reservedAttendances.push({
                user: {
                    firstName: user.firstName,
                    _id: user._id
                },
                times: []
            });

            await calendar.save();
        } catch (e) {
            throw new AppError(e.message, e.status, e.errors);
        }
    }

    public getConnectedCalendars = async () => {
        //
    }
}