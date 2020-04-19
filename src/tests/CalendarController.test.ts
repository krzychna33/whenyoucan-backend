import {expect} from "chai";
import request from "supertest";

import {pushCalendarsToDb, pushUsersToDb, users} from "./seeds/seed";
import {app} from "../server";
import {CalendarModel} from "../models/Calendar";

const expressApp = app.app;

beforeEach(pushUsersToDb);
beforeEach(pushCalendarsToDb);

describe('CalendarController' ,() => {
    it('Should create new calendar', (done) => {
        const name = "Calendar Name";

        request(expressApp)
            .post('/weekly-calendars')
            .set('x-auth', users[0].tokens[0].token)
            .send({name})
            .expect(200)
            .expect((res) => {
                expect(res.body.name).to.equal(name);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                CalendarModel.find({name}).then((todos) => {
                    expect(todos.length).to.equal(1);
                    expect(todos[0].name).to.equal(name);
                }).catch(e => done(e));

                done();
            })
    })
});