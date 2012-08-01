var Profile = amplify.store("profile") || amplify.store("profile", {"username": ""});

Session.set("user_id", Profile.username || null);
Session.set("current_panel", null)

Meteor.subscribe("rooms");
Meteor.subscribe("users");

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
            "click .hide": function(e){
                $("#" + panel_id).detach();
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

    Meteor.subscribe("chats", room._id);
}
Template.rooms.rooms = function(){
    return Room.find();
};
Template.rooms.events = {
    'click .enter': function(evt){
        enter_room(this);
    }
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
