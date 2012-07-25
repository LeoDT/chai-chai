
Session.set("user_id", null);

Session.set("room_ids", null);

Meteor.subscribe("rooms", function() {
    if(!Session.get("room_ids")){
        var default_room = Room.findOne({name: "default"});
	console.log(default_room);
        if(default_room){
            Session.set("room_ids", [default_room]);
        }
    }
});

Meteor.autosubscribe(function() {
    var room_ids = Session.get("room_ids");
    if(room_ids){
        _.each(room_ids, function(room_id) {
            Meteor.subscribe("chats", room_id);
        });
    }
});
