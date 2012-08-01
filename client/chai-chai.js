var profile = amplify.store("profile") || amplify.store("profile", {"username": ""}),
last_session = amplify.store("last_session") || amplify.store("last_session", []);

Session.set("user_id", profile.username || null);

Meteor.subscribe("rooms", function(){
    init();
});
Meteor.subscribe("users", function(){
    login(Session.get("user_id"));
});

function register(username){
    var exists = User.findOne({
	"name": username
    });

    if(exists){
	User.update({"name": username}, {$set:{
	    "online": true
        }});
	return username;
    }
    else{
	User.insert({
	    "name": username,
	    "online": true
        });
	return username;
    }
}

function login(username){
    username = register(username);

    Session.set("user_id", username);

    amplify.store("profile", {"username": Session.get("user_id")});
}

function init(){
    if(!_.isEmpty(last_session)){
        _.each(last_session, function(v,i){
            var session_id = v.replace("panel_", ""),
                room = Room.findOne({_id: session_id}),
                user;
            if(room){
                enter_room(room);
            }
            else{
                user = User.find({_id: session_id});
                if(user){
                    console.log("last_session: user " + session_id);
                }
            }
        });
    }
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
Template.profile.logined = function(){
    return Session.get("user_id") ? "logined" : "login";
};
Template.profile.username = function(){
    return Session.get("user_id");
};


///////// rooms /////////
function enter_room(room){
    var panels = $(".panels"),
        panel_id = "panel_" + room._id,
        panel;

    panel = Meteor.ui.render(function(){
        Template.panel.events = {
            "keyup .chat-text": function(e){
                if(e.ctrlKey && e.keyCode == 13 && e.target.value){
                    Chat.insert({
                        room_id: room._id,
                        content: e.target.value,
                        user_id: Session.get("user_id"),
                        updated: moment().utc().format()
                    });
                    e.target.value = "";
                }
            },
            "click .quit-room": function(e){
                $("#" + panel_id).detach();
                Room.update({_id: room._id}, {$pull: {"entered_users": Session.get("user_id")}});
                amplify.store("last_session", _.without(last_session, panel_id));
            }
        };
        return Template.panel({
            panel_title: "panel " + room.name,
            panel_id: panel_id,
            panel_type: "room",
            chats: Chat.find({room_id: room._id})
        });
    });

    panels.append(panel);

    Room.update({_id: room._id}, {$addToSet: {"entered_users": Session.get("user_id")}});
    amplify.store("last_session", _.union(last_session, [panel_id]));

    Meteor.subscribe("chats", room._id);
}
Template.rooms.rooms = function(){
    return Room.find();
};
Template.rooms.events = {
    'click .room-name': function(e){
        enter_room(this);
        e.preventDefault();
    }
};
Template.rooms.user_count = function(){
    return this.entered_users ? this.entered_users.length : 0;
};


//////// users //////////
Template.users.users = function(){
    return User.find({
        "online": true
    });
};
Template.users.can_chat = function(){
    if(this.name != Session.get("user_id")){
	return true;
    }
    return false;
};
Template.users.events = {
    "click .chat": function(e){

    }
};


//////// chats //////////
Template.chat_item.updated = function(){
    return moment(this.updated).local().format();
};
Template.chat_item.content = function(){
    return this.content.replace(/(\#.*?\#)/ig, '<a class=\"chat-tags\" href="#">$1</a>');
};


/////// search chats /////////
Template.search_chats.show = function(){
    return true;
};
