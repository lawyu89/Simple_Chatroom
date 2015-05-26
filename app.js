var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(client){
  console.log('Client connected...')
  client.on('join', function(name){
    client.nickname = name
    client.emit('messages', {name: name, message: ' has join the chat.'})
    client.broadcast.emit('messages', {name: name, message: ' has join the chat.'})
  })
  client.on('messages', function(data){
    client.emit('messages', {name: client.nickname, message: ': '+data})
    client.broadcast.emit('messages', {name: client.nickname, message: ': '+data});
  })
})

app.get('/',function(req, res){
  res.sendFile(__dirname + '/index.html')
})

server.listen(8080)