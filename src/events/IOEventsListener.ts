import socketIO from "socket.io";

export class IOEventsListener {
    public io: socketIO.Server;

    constructor(io: socketIO.Server) {
        this.io = io;

        this.listenEvents();
    }

    private listenEvents() {
        this.io.on('connection', (socket) => {
            console.log("IO CONNECTED")
            socket.on('join', (params, callback) => {
                socket.join(params.calendarId);
                console.log("USER JOINED TO " + params.calendarId)
                socket.emit("JOINED", {userId: params.userId})
                callback();
            })
        });
    }
}