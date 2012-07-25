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
