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
const userTwoId = new ObjectId();
const userThreeId = new ObjectId();

export const users: IUserEntity[] = [
    {
        _id: userOneId,
        email: 'seed@example.com',
        password: 'password1',
        firstName: 'seed1',
        lastName: 'seed1',
        facebookId: "fbid",
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({_id: userOneId, access: 'auth'}, `${process.env.JWT_SECRET}`).toString()
            }]
    },
    {
        _id: userTwoId,
        email: 'seed2@example.com',
        password: 'password1',
        firstName: 'seed2',
        lastName: 'seed2',
        facebookId: "fbid2",
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({_id: userTwoId, access: 'auth'}, `${process.env.JWT_SECRET}`).toString()
            }]
    },
    {
        _id: userThreeId,
        email: 'seed3@example.com',
        password: 'password1',
        firstName: 'seed3',
        lastName: 'seed3',
        facebookId: "fbid3",
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({_id: userThreeId, access: 'auth'}, `${process.env.JWT_SECRET}`).toString()
            }]
    }
];

const calendarOneId = new ObjectId();
const calendarTwoId = new ObjectId();
const calendarThreeId = new ObjectId();

export const calendars: ICalendarEntity[] = [
    {
        _id: calendarOneId,
        name: "Seeder Calendar 1",
        ownerId: userOneId,
        users: [userTwoId.toString(), userOneId.toString()],
        pin: "1234",
        description: "",
        reservedAttendances: [
            {
                user: {
                    _id: userOneId.toString(),
                    firstName: users[0].firstName
                },
                times: []
            },
            {
                user: {
                    _id: userTwoId.toString(),
                    firstName: users[1].firstName
                },
                times: []
            }
        ]
    },
    {
        _id: calendarTwoId,
        name: "Seeder Calendar 2",
        ownerId: userTwoId,
        users: [userTwoId.toString(), userThreeId.toString(), userOneId.toString()],
        pin: "1234",
        description: "",
        reservedAttendances: [
            {
                user: {
                    _id: userTwoId.toString(),
                    firstName: users[1].firstName
                },
                times: []
            },
            {
                user: {
                    _id: userThreeId.toString(),
                    firstName: users[2].firstName
                },
                times: []
            },
            {
                user: {
                    _id: userOneId.toString(),
                    firstName: users[0].firstName
                },
                times: []
            }
        ]
    },
    {
        _id: calendarThreeId,
        name: "Seeder Calendar 3",
        ownerId: userTwoId,
        users: [userTwoId.toString(), userThreeId.toString()],
        pin: "1234",
        description: "",
        reservedAttendances: [
            {
                user: {
                    _id: userTwoId.toString(),
                    firstName: users[1].firstName
                },
                times: []
            },
            {
                user: {
                    _id: userThreeId.toString(),
                    firstName: users[2].firstName
                },
                times: []
            }
        ]
    }
];


export const pushUsersToDb = (done: Mocha.Done) => {
    UserModel.deleteMany({}).then(() => {
        const user1 = new UserModel(users[0]).save();
        const user2 = new UserModel(users[1]).save();
        const user3 = new UserModel(users[2]).save();
        return Promise.all([user1, user2, user3]);
    }).then(() => {
        done();
    });
};

export const pushCalendarsToDb = (done: Mocha.Done) => {
    CalendarModel.deleteMany({}).then(() => {
        const calendar1 = new CalendarModel(calendars[0]).save();
        const calendar2 = new CalendarModel(calendars[1]).save();
        const calendar3 = new CalendarModel(calendars[2]).save();
        return Promise.all([calendar1, calendar2, calendar3]);
    }).then(() => {
        done();
    })
};


