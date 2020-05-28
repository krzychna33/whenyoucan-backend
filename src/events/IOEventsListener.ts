import socketIO from "socket.io";

export class IOEventsListener {
    public io: socketIO.Server;

    constructor(io: socketIO.Server) {
        this.io = io;

        this.listenEvents();
    }

    private listenEvents() {
        this.io.on('connection', (socket) => {
            socket.on('join', (params, callback) => {
                socket.join(params.calendarId);
            });

            socket.on('LEAVE_ROOM', (params) => {
                socket.leave(params.calendarId)
            })


        });
    }
}