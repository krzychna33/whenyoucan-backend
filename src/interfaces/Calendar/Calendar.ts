import mongoose, {Document, Model} from "mongoose";

export interface ReservedAttendances {
    user: {
        _id: string,
        firstName: string
    }
    times: any[]
}

export interface ICalendarEntity {
    _id: any,
    ownerId: any
    name: string,
    users: any,
    pin: string,
    description?: string,
    expectedUsersCount?: number,
    reservedAttendances: ReservedAttendances[]
}
export interface ICalendar extends Document, ICalendarEntity{
    getConnected() : any
    getPublic(): any
    getConnectedUsers(): any,
    _doc: ICalendar
}

export interface ICalendarPublic {
    _id: any,
    ownerId: any
    name: string,
    users: any,
    reservedAttendances: ReservedAttendances[]
}

export interface ICalendarSchema extends Model<ICalendar>{

}