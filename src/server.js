// Generated by CoffeeScript 2.5.1
(function() {
  var Chunk, PORT, app, express, http, io, mineflayer, server, si;

  express = require('express');

  app = express();

  http = require("http");

  server = http.createServer(app);

  io = require("socket.io")(server, {
    cors: {
      origin: "*"
    }
  });

  mineflayer = require("mineflayer");

  Chunk = require("prismarine-chunk")("1.16.3");

  si = {};

  PORT = 8081;

  server.listen(PORT, function() {
    return console.log(`Server is running on \x1b[34m*:${PORT}\x1b[0m`);
  });

  io.sockets.on("connection", function(socket) {
    si[socket.id] = {};
    socket.on("initClient", function(nick) {
      console.log(`[\x1b[32m+\x1b[0m] ${nick}`);
      si[socket.id].nick = nick;
      si[socket.id].bot = mineflayer.createBot({
        host: "localhost",
        port: 25565,
        username: nick,
        version: "1.16.3"
      });
      si[socket.id].bot._client.on("map_chunk", function(packet) {
        var cell;
        cell = new Chunk();
        cell.load(packet.chunkData, packet.bitMap);
        socket.emit("mapChunk", cell.toJson(), packet.x, packet.z);
      });
      si[socket.id].bot.on("move", function(pos) {
        return socket.emit("move", pos.x, pos.y, pos.z);
      });
    });
    socket.on("move", function(state, toggle) {
      si[socket.id].bot.setControlState(state, toggle);
    });
    socket.on("look", function(yaw, pitch) {
      si[socket.id].bot.look(yaw, pitch);
    });
    socket.on("disconnect", function() {
      console.log(`[\x1b[31m-\x1b[0m] ${si[socket.id].nick}`);
      si[socket.id].bot.end();
      delete si[socket.id];
    });
  });

}).call(this);
