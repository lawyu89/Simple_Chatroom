var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var redisClient

if (process.env.REDISTOGO_URL){
  var rtg = require('url').parse(process.env.REDISTOGO_URL)
  var redisClient = require('redis').createClient(rtg.port, rtg.hostname)
  redisClient.auth(rtg.auth.split(':')[1])
} else {
  var redisClient = require('redis').createClient();
}

io.on('connection', function(client){
  console.log('Client connected...')
  client.on('join', function(name){
    client.nickname = name
    redisClient.lrange('messages', 0, -1, function(err, messages){
      messages = messages.reverse();
      messages.forEach(function(message){
        client.emit("messages", JSON.parse(message));
      })
    })
    redisClient.sadd('names', name)
    redisClient.smembers('names', function(err, names){
      names.forEach(function(name){
        client.emit('addUser', name)
      })
    })
    client.broadcast.emit('addUser', name)
    client.emit('messages', {name: name, message: ' has join the chat.'})
    client.broadcast.emit('messages', {name: name, message: ' has join the chat.'})
  })
  client.on('addUser', function(name){
    redisClient.lrange('messages', 0, -1, function(err, messages){
      messages = messages.reverse();
      messages.forEach(function(message){
        client.emit("addUser", message.name);
      })
    })
  })
  client.on('messages', function(data){
    client.emit('messages', {name: client.nickname, message: ': '+data})
    client.broadcast.emit('messages', {name: client.nickname, message: ': '+data});
    var message = JSON.stringify({name: client.nickname, message: ':'+data})
    redisClient.lpush('messages', message, function(err, res){
      redisClient.ltrim('messages', 0, 9)
    })
  })
  client.on('disconnect', function(name){
    redisClient.get(client.nickname, function(err, name){
      client.broadcast.emit('removeUser', client.nickname)
      redisClient.srem('names', client.nickname)
    })
  })
})

app.get('/',function(req, res){
  res.sendFile(__dirname + '/index.html')
})


var port = Number(process.env.PORT || 8080)
server.listen(port)
