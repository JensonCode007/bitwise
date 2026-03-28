import express from "express";
import http, { createServer, METHODS } from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin:"*",
        methods: ['GET', 'POST']
    }
}
);

io.on("connection", (socket)=>{
    console.log(`New User connected to : ${socket.id}`);


    socket.on("code-change", ({roomId, newCode} : {"roomId": string, "newCode": string})=>{
        socket.to(roomId).emit("code-update", newCode);
    })

    socket.on("join-room", (roomId: string)=>{
        socket.join(roomId);

        socket.to(roomId).emit("user-joined", socket.id)
    })

    socket.on("disconnect",
        ()=> {
            console.log(`User disconnected from : ${socket.id}`)
        }
    )
}
)

const PORT = 5000;
server.listen(PORT, ()=>{
    console.log(`Server listening on port ${PORT}`)
})


