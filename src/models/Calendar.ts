import mongoose, {Schema} from "mongoose";
import {ICalendar, ICalendarSchema} from "../interfaces/Calendar/Calendar";

const {ObjectId, Date} = mongoose.Schema.Types;

const CalendarSchema = new Schema({
    ownerId: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    pin: {
        type: String
    },
    users: [
        ObjectId
    ],
    reservedAttendances: [
        {
            user: {
                firstName: String,
                _id: ObjectId
            },
            times: []
        }
    ]
}, { usePushEach: true });

CalendarSchema.methods.getPublic = function () {
    const {_id, ownerId, name, users, reservedAttendances} = this;

    return {
        _id, ownerId, name, users, reservedAttendances
    }
};

export const CalendarModel = mongoose.model<ICalendar, ICalendarSchema>('Calendar', CalendarSchema)

