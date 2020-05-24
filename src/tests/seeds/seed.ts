import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import {IUserEntity} from "../../interfaces/User/User";
import UserModel from "../../models/User";
import * as path from "path";
import {ICalendarEntity} from "../../interfaces/Calendar/Calendar";
import {CalendarModel} from "../../models/Calendar";

const {ObjectId} = mongoose.Types;
require('dotenv').config({path: path.resolve(process.cwd(), '.env.test')});

const userOneId = new ObjectId();

export const users: IUserEntity[] = [
    {
        _id: userOneId,
        email: 'seed@example.com',
        password: 'password1',
        firstName: 'seed1',
        lastName: 'seed1',
        facebookId: "fbid",
        tokens:[
            {
                access: 'auth',
                token: jwt.sign({_id: userOneId, access: 'auth'}, `${process.env.JWT_SECRET}`).toString()
            }]
    }
];

const calendarOneId =  new ObjectId();

export const calendars: ICalendarEntity[] = [
    {
        _id: calendarOneId,
        name: "Seeder Calendar 1",
        ownerId: userOneId,
        users: [],
        pin: "1234",
        description: "",
        reservedAttendances: [
            {
                user: {
                    _id: userOneId.toString(),
                    firstName: users[0].firstName
                },
                times: []
            }
        ]
    }
];


export const pushUsersToDb = (done: Mocha.Done) => {
    UserModel.deleteMany({}).then(() => {
        const user1 = new UserModel(users[0]).save();
        return Promise.all([user1]);
    }).then(() => {
        done();
    });
};

export const pushCalendarsToDb = (done: Mocha.Done) => {
    CalendarModel.deleteMany({}).then(() => {
        const calendar1 = new CalendarModel(calendars[0]).save();
        return Promise.all([calendar1]);
    }).then(() => {
        done();
    })
};


