Meteor.publish("rooms", function() {
    return Room.find();
});

Meteor.publish("users", function() {
    return User.find();
});

Meteor.publish("chats", function(room_id) {
    return Chat.find({
        room_id: room_id
    });
});

Meteor.publish("messages", function(from_user_id, to_user_id){
    return Message.find({$or: [
        {to_user_id: to_user_id, user_id: from_user_id},
        {user_id: to_user_id, to_user_id: from_user_id}
    ]});
});
