import {AppEventEmitter} from "./AppEventEmitter";
import {EVENT_TYPE_NEW_ATTENDANCE, IO_TYPE_NEW_ATTENDANCE} from "./eventTypes.const";
import {app} from "../server";

export const calendarEventEmitter = new AppEventEmitter();

calendarEventEmitter.on(EVENT_TYPE_NEW_ATTENDANCE, ({calendarId, userId}) => {
    app.io.to(calendarId).emit(IO_TYPE_NEW_ATTENDANCE, {userId})
});
