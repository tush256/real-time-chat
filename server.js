const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utiles/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utiles/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));

const botname = 'Chat Bot';

//run time client connect
io.on('connection', socket => {

    socket.on('joinRoom', ({username,room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome current user
    socket.emit('message', formatMessage(botname, 'Welcome to chat'));

    //broadcast when a user connects
    socket.broadcast.to(user, room).emit('message', formatMessage(botname, `${username} user has joined the chat`));
    //send users  and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });

    });

    //listen to chatmsg
    socket.on('chatMessage',(msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    //runs when clients discconect
    socket.on('disconnect', () => {
        const user= userLeave(socket.id);

        if(user){
        io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));
}
});
});

const PORT = 5000 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})