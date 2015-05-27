var express = require('express');
var url = require('url');
var app = express();
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis')

var redisClient

if (process.env.REDISCLOUD_URL){
  var redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
  redisClient.auth(redisURL.auth.split(":")[1]);
} else {
  redisClient = redis.createClient();
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
  res.render('index.html')
})


var port = Number(process.env.PORT || 8080)
server.listen(port, function(){
  console.log("Listeing on " + port)
})
