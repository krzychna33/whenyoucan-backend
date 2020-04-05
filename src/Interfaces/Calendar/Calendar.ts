import mongoose, {Document, Model} from "mongoose";

const {ObjectId, Date} = mongoose.Schema.Types

export interface ICalendar extends Document{
    ownerId: any
    name: string,
    users: any
    attendances: {
        user: any
        times: typeof Date
    }
}

export interface ICalendarSchema extends Model<ICalendar>{

}