var server = io.connect('http://'+window.location.host);
$('#name').on('submit', function(e){
  e.preventDefault();
  $(this).hide();
  $('#chat_form').show();
  var name = $('#name_input').val()
  server.emit('join', name)
  $('#status').text('Status: Connected to chat')
});
$('#chat_form').on('submit', function(e){
  e.preventDefault();
  var message = $('#chat_input').val();
  server.emit('messages', message);
});
server.on('messages', function(data){
  insertMessage(data);
})
server.on('addUser', function(name){
  insertUser(name)
})
server.on('removeUser', function(name){
  $('#'+name).remove()
  insertLeaveMessage(name)
})
function insertMessage(data) {
  $('#chatbox').append('<p class="messages">'+data.name+data.message+'</p>')
  if ($('#chatbox').children().length > 11){
    $($('#chatbox').children()[3]).remove()
  }
  $('#chat_form #chat_input').val('')
}
function insertLeaveMessage(data) {
  $('#chatbox').append('<p class="messages">'+data+' has left the chat</p>')
}
function insertUser(data){
  $('#current_users').append('<p id='+data+'>'+data+'</p>')
}