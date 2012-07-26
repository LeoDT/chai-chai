
Session.set("user_id", null);

Session.set("room_id", null);

Meteor.subscribe("rooms", function() {
    if(!Session.get("room_id")){
        var default_room = Room.findOne({name: "default"});
        if(default_room){
            Session.set("room_id", default_room._id);
	    Meteor.subscribe("chats", default_room._id);
        }
    }
});


///////// rooms /////////
Template.rooms.rooms = function(){
    return Room.find();
};
Template.rooms.events = {
    'click .enter': function(evt){
	Session.set("room_id", this._id);
        Meteor.subscribe("chats", this._id);
    }
};


//////// chats //////////
Template.chats.chats = function(){
    return Chat.find({room_id: Session.get("room_id")});
};


/////// chat input ///////////
Template.chat_input.events = {
    "keyup #chat-text": function(e){
        if(e.keyCode == 13){
	    Chat.insert({
	        room_id: Session.get("room_id"),
	        content: e.target.value
            });
        }
    }
};
