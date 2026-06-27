// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Telegram Web App uchun barcha domenlarga ruxsat
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('Yangi o\'yinchi ulandi:', socket.id);

    // Xona yaratish yoki unga qo'shilish
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        if (!rooms[roomCode]) rooms[roomCode] = {};
        
        rooms[roomCode][socket.id] = {
            x: Math.random() * 500 + 100, 
            y: Math.random() * 500 + 100,
            camouflaged: false,
            color: '#ff0000' // Boshlang'ich rang
        };

        socket.emit('roomJoined', roomCode);
        io.to(roomCode).emit('updatePlayers', rooms[roomCode]);
    });

    // Harakat va holatni yangilash
    socket.on('playerMovement', (data) => {
        const { room, x, y, camouflaged, color } = data;
        if (rooms[room] && rooms[room][socket.id]) {
            rooms[room][socket.id].x = x;
            rooms[room][socket.id].y = y;
            rooms[room][socket.id].camouflaged = camouflaged;
            rooms[room][socket.id].color = color;
            
            // Boshqa o'yinchilarga yangi koordinatalarni jo'natish
            socket.to(room).emit('updatePlayers', rooms[room]);
        }
    });

    socket.on('disconnect', () => {
        for (const room in rooms) {
            if (rooms[room][socket.id]) {
                delete rooms[room][socket.id];
                io.to(room).emit('updatePlayers', rooms[room]);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server 3000-portda ishlamoqda...');
});
