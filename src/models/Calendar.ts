import mongoose, {Schema} from "mongoose";
import {ICalendar, ICalendarSchema} from "../Interfaces/Calendar/Calendar";

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
    users: [
        ObjectId
    ],
    attendances: [
        {
            user: ObjectId,
            times: [Date]
        }
    ]
}, { usePushEach: true });

export const CalendarModel = mongoose.model<ICalendar, ICalendarSchema>('Calendar', CalendarSchema)

