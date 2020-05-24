import mongoose, {Schema} from "mongoose";
import {ICalendar, ICalendarSchema} from "../interfaces/Calendar/Calendar";
import UserModel from "./User";

const {ObjectId, Date} = mongoose.Schema.Types;

const CalendarSchema = new Schema({
    ownerId: {
        type: ObjectId,
        required: true,
        ref: "User"
    },
    name: {
        type: String,
        required: true,
        maxlength: 24
    },
    description : {
        type: String,
        required: false,
        maxlength: 100
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

CalendarSchema.methods.getConnectedUsers = async function () {
    const {users} = this;
    const usersDocs = await UserModel.find({_id: {
        $in: users
        }})

    const publicUsers = usersDocs.map(item => item.getPublic());

    return [
        ...publicUsers
    ]
}

CalendarSchema.methods.getConnected = function () {
    const {_id, ownerId, name, users, reservedAttendances, description} = this;

    return {
        _id, ownerId, name, users, reservedAttendances, description
    }
};

CalendarSchema.methods.getPublic = function () {
    const {_id, name, description} = this;

    return {
        _id, name, description
    }
};

export const CalendarModel = mongoose.model<ICalendar, ICalendarSchema>('Calendar', CalendarSchema)

