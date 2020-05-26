import {CalendarModel} from "../models/Calendar";
import {IUser} from "../interfaces/User/User";
import {CreateCalendarDto} from "../interfaces/Calendar/CreateCalendarDto";
import {AppError} from "../utils/AppError";

export default class CalendarService {

    public createNewCalendar = async (body: CreateCalendarDto, user: IUser) => {

        const calendar = new CalendarModel({
            name: body.name,
            ownerId: user._id,
            pin: body.pin ? body.pin : "",
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
            throw new AppError(e.message, e.errors);
        }
    }

    public getOwnCalendars = async (userId: string) => {
        try {
            const calendars = await CalendarModel.find({
                ownerId: userId
            });
            return calendars;
        } catch (e) {
            throw new AppError(e.message, e.errors)
        }
    }

    public updateUserAttendances = async (userId: string, calendarId: string, times: any) => {
        try {
            const calendar = await CalendarModel.findOneAndUpdate(
                {_id: calendarId, users: userId},
                {$set: {"reservedAttendances.$[outer].times": times}},
                {arrayFilters: [{"outer.user._id": userId}]}
            );

            if (!calendar) {
                throw new AppError('Calendar not found!')
            }

            return calendar;

        } catch (e) {
            throw new AppError(e.message, e.errors)
        }
    }
}