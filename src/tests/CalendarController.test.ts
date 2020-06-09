import {expect} from "chai";
import request from "supertest";

import {calendars, pushCalendarsToDb, pushUsersToDb, users} from "./seeds/seed";
import {app} from "../server";
import {CalendarModel} from "../models/Calendar";
import moment from "moment";

const expressApp = app.app;

beforeEach(pushUsersToDb);
beforeEach(pushCalendarsToDb);

describe('CalendarController', () => {
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

                CalendarModel.find({name}).then((calendars) => {
                    expect(calendars.length).to.equal(1);
                    expect(calendars[0].name).to.equal(name);
                }).catch(e => done(e));

                done();
            })
    });

    it("Should get all owns calendars", (done) => {
        request(expressApp)
            .get("/weekly-calendars/own")
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {

                const ownCalendars = calendars.filter((calendar) => {
                    if (calendar.ownerId.toString() === users[0]._id.toString()) {
                        return calendar;
                    }
                });

                expect(res.body.results.length).to.equal(ownCalendars.length);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                done();
            })
    });

    it("Should get calendar with owner permissions", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/${calendars[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {

                expect(res.body._id.toString()).to.equal(calendars[0]._id.toString());
                expect(res.body).to.include.keys([
                    'name',
                    'description',
                    'pin',
                    'ownerId',
                    'users',
                    'reservedAttendances'
                ]);
            })
            .end(done)
    });

    it("Should get calendar with connectedUsers permissions", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/${calendars[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id.toString()).to.equal(calendars[0]._id.toString());
                expect(res.body).to.include.keys([
                    '_id', 'ownerId', 'name', 'users', 'reservedAttendances', 'description'
                ]);
                expect(res.body).to.not.include.keys(['pin']);
            })
            .end(done)
    });

    it("Should get calendar with public permissions", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/${calendars[0]._id}`)
            .expect(200)
            .expect((res) => {
                expect(res.body._id.toString()).to.equal(calendars[0]._id.toString());
                expect(res.body).to.include.keys([
                    '_id', 'name', 'description'
                ]);
                expect(res.body).to.not.include.keys(['pin', 'users', 'reservedAttendances']);
            })
            .end(done)
    });

    it("Should get calendar with public permissions (logged as user not associated with calendar)", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/${calendars[0]._id}`)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id.toString()).to.equal(calendars[0]._id.toString());
                expect(res.body).to.include.keys([
                    '_id', 'name', 'description'
                ]);
                expect(res.body).to.not.include.keys(['pin', 'users', 'reservedAttendances']);
            })
            .end(done)
    });

    it("Should update attendances (Adding as Owner)", (done) => {

        const times = [
            moment().toISOString(),
            moment().add(2, "days").toISOString()
        ]


        request(expressApp)
            .post(`/weekly-calendars/update-attendances/${calendars[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({times})
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }

                    expect(calendar.reservedAttendances[1].times.length).to.equal(calendars[0].reservedAttendances[1].times.length)
                    expect(calendar.reservedAttendances[0].times.length).to.equal(times.length);
                    done();
                }).catch(e => done(e))
            })

    });

    it("Should update attendances (Adding as Connected user)", (done) => {

        const times = [
            moment().toISOString(),
            moment().add(2, "days").toISOString()
        ]


        request(expressApp)
            .post(`/weekly-calendars/update-attendances/${calendars[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({times})
            .expect(200)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }

                    expect(calendar.reservedAttendances[0].times.length).to.equal(calendars[0].reservedAttendances[0].times.length)
                    expect(calendar.reservedAttendances[1].times.length).to.equal(times.length);
                    done();
                }).catch(e => done(e))

            })

    });

    it("Should NOT update attendances (Adding as NOT connected user)", (done) => {

        const times = [
            moment().toISOString(),
            moment().add(2, "days").toISOString()
        ]

        request(expressApp)
            .post(`/weekly-calendars/update-attendances/${calendars[0]._id}`)
            .set('x-auth', users[2].tokens[0].token)
            .send({times})
            .expect(400)
            .end((err, res) => {
                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }

                    expect(calendar.reservedAttendances).to.deep.equal(calendars[0].reservedAttendances)
                    done();
                }).catch((e) => {
                    done();
                })
            })
    });

    it("Should join user to calendar" , (done) => {
        request(expressApp)
            .post(`/weekly-calendars/join/${calendars[0]._id}`)
            .set('x-auth', users[2].tokens[0].token)
            .send({pin: calendars[0].pin})
            // .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }
                    expect(calendar.users).to.include.members([users[2]._id]);
                    expect(calendar.users.length).to.equal(calendars[0].users.length + 1)
                    done();
                }).catch(e => done(e));
            })
    });

    it("Should NOT join user to calendar (wrong pin)" , (done) => {
        request(expressApp)
            .post(`/weekly-calendars/join/${calendars[0]._id}`)
            .set('x-auth', users[2].tokens[0].token)
            .send({pin: "ANOTHER PIN"})
            .expect(401)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }
                    expect(calendar.users).to.not.include.members([users[2]._id]);
                    expect(calendar.users.length).to.equal(calendars[0].users.length)
                    done();
                }).catch(e => done(e));
            })
    });

    it("Should NOT join user to calendar (Already joined)" , (done) => {
        request(expressApp)
            .post(`/weekly-calendars/join/${calendars[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({pin: calendars[0].pin})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Not found!");
                    }
                    expect(calendar.users).to.include.members([users[1]._id]);
                    expect(calendar.users.length).to.equal(calendars[0].users.length)
                    done();
                }).catch(e => done(e));
            })
    });

    it("Should NOT join user to calendar (Join as owner)" , (done) => {
        request(expressApp)
            .post(`/weekly-calendars/join/${calendars[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({pin: calendars[0].pin})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                CalendarModel.findOne({_id: calendars[0]._id}).then((calendar) => {
                    if (!calendar) {
                        return done();
                    }
                    expect(calendar.users).to.include.members([users[0]._id]);
                    expect(calendar.users.length).to.equal(calendars[0].users.length)
                    done();
                }).catch(e => done(e));
            })
    });

    it("Should return all connected calendars", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/connected`)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                const connectedCalendars = calendars.filter((calendar) => {
                    const isContainUsers = calendar.users.find((userId) => {
                        if (userId.toString() === users[2]._id.toString()) {
                            return userId;
                        }
                    })
                    if (isContainUsers) {
                        return calendar
                    }
                });

                expect(res.body.results.length).to.equal(connectedCalendars.length);
                done();
            })
    });

    it("Should return all users connected with calendar", (done) => {
        request(expressApp)
            .get(`/weekly-calendars/${calendars[1]._id}/users`)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                const exceptedUsersCount = calendars[1].users.length;
                expect(res.body.results.length).to.equal(exceptedUsersCount);
                done();
            })
    });

    it("Should disconnect calendar" , done => {
        request(expressApp)
            .get(`/weekly-calendars/disconnect/${calendars[2]._id}`)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                const connectedCalendars = calendars.filter((calendar) => {
                    const isContainUsers = calendar.users.find((userId) => {
                        if (userId.toString() === users[2]._id.toString()) {
                            return userId;
                        }
                    })
                    if (isContainUsers) {
                        return calendar
                    }
                });

                CalendarModel.findOne({_id: calendars[2]._id}).then((calendar) => {
                    if (!calendar) {
                        return done("Calendar not found!")
                    }
                    expect(calendar.users.length).to.equal(connectedCalendars.length - 1);
                    done();
                }).catch((e) => done(e));
            })
    })


});