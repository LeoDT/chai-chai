var Profile = amplify.store("profile") || amplify.store("profile", {"username": ""});

Session.set("user_id", Profile.username || null);

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

function login(username){
    Session.set("user_id", username);

    amplify.store("profile", {"username": Session.get("user_id")});
}

///////// profile /////////
Template.profile.events = {
    'keyup #username': function(e){
	if(e.keyCode == 13){
	    if(!e.target.value){
		alert("username must be inputed.");
	    }
	    else{
		login(e.target.value);
	    }
	}
    }
};
Template.profile.logined = Session.get("user_id") ? "logined" : "login";
Template.profile.username = Session.get("user_id");

///////// rooms /////////
Template.rooms.rooms = function(){
    return Room.find();
};
Template.rooms.in_room = function(){
    if(this._id == Session.get("room_id")){
	return true;
    }
    return false;
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
Template.chats.updated = function(){
    return this.updated.replace("T", " ").replace("Z", "");
};
Template.chats.content = function(){
    console.log(this.content);
    return this.content.replace(/(\#.*?\#)/ig, '<a class=\"chat-tags\" href="#">$1</a>');
};

/////// chat input ///////////
Template.chat_input.events = {
    "keyup #chat-text": function(e){
        if(e.ctrlKey && e.keyCode == 13 && e.target.value){
	    Chat.insert({
	        room_id: Session.get("room_id"),
	        content: e.target.value,
		user_id: Session.get("user_id"),
		updated: new Date()
            });
	    e.target.value = "";
        }
    }
};
