const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static("public"));

io.on("connection", socket => {
	console.log("New WebSocket connection");

	socket.on("join", ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit("admin-message", "Welcome");
		socket.broadcast.to(user.room).emit("admin-message", `${user.username} has joined!`);
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room)
		});

		callback();
	});

	socket.on("typing", () => {
		const user = getUser(socket.id);

		socket.broadcast.to(user.room).emit("messageTyping", user);
	});

	socket.on("sendMessage", (msg, callback) => {
		const user = getUser(socket.id);

		socket.emit("message", generateMessage(user.username, msg, "message_mine"));
		socket.broadcast.to(user.room).emit("message", generateMessage(user.username, msg));
		callback();
	});

	socket.on("sendLocation", (coords, callback) => {
		const user = getUser(socket.id);

		socket.emit("location", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`, "message_mine"));
		socket.broadcast.to(user.room).emit("location", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
		callback();
	});

	socket.on("disconnect", () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit("admin-message", `${user.username} has left!`);
			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}
	});
});

server.listen(port, () => {
	console.log("Server is listnening port 3000");
});
