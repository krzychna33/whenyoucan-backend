import mongoose, {Document, Model} from "mongoose";

export interface ReservedAttendances {
    user: {
        _id: string,
        firstName: string
    }
    times: any[]
}

export interface ICalendar extends Document{
    ownerId: any
    name: string,
    users: any,
    pin: string,
    reservedAttendances: ReservedAttendances[]
    getPublic() : any
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