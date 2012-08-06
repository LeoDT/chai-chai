var profile = amplify.store("profile") || amplify.store("profile", {"user_id": ""}),
last_session = amplify.store("last_session") || amplify.store("last_session", []);

Session.set("user_id", profile.user_id || null);

Meteor.subscribe("rooms");

Meteor.subscribe("users", function(){
    if(Session.get("user_id")){
        login(Session.get("user_id"));
    }

    init();
});

function register(username, callback){
    var exists = User.findOne({
	"name": username
    });

    if(exists){
	User.update({"_id": exists._id}, {$set:{
	    "online": true
        }});
        callback(exists._id);
    }
    else{
	User.insert({
	    "name": username,
	    "online": true
        }, function(error, user_id){
            callback(user_id);
        });
    }
}

function login(user_id){
    if(User.findOne({_id: user_id})){
        Session.set("user_id", user_id);
        amplify.store("profile", {"user_id": Session.get("user_id")});
    }
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
                user = User.findOne({_id: session_id});
                if(user){
                    chat_user(user);
                }
            }
        });
    }

    Message.find({to_user_id: Session.get("user_id")}).observe({
        added: function(msg, index){
            var panel_id = "panel_" + msg.user_id;
            if($("#" + panel_id).length < 1){
                chat_user(User.findOne({_id: msg.user_id}));
            }
        }
    });

    Room.find().forEach(function(room){
        Meteor.subscribe("chats", room._id);
    });

    $(".panel-tabs").on("click", ".tab a", function(e){
        var tab_link = $(e.target),
            tab = tab_link.parent(),
            pane = $(tab_link.attr("href"));

        $(".tab-pane").removeClass("active");
        pane.addClass("active");

        $(".tab").removeClass("active");
        tab.addClass("active");
    });
}

///////// profile /////////
Template.profile.events = {
    'keyup #username': function(e){
	if(e.keyCode == 13){
	    if(!e.target.value){
		alert("username must be inputed.");
	    }
	    else{
                register(e.target.value, function(user_id){
                    login(user_id);
                });
            }
	}
    }
};
Template.profile.logined = function(){
    return Session.get("user_id") ? "logined" : "login";
};
Template.profile.username = function(){
    var user = User.findOne({_id: Session.get("user_id")});
    if(user){
        return user.name;
    }
    return "";
};


///////// rooms /////////
function enter_room(room){
    var tabs = $(".panel-tabs"),
        panels = $(".panels"),
        panel_id = "panel_" + room._id,
        panel_tab_id = "panel_tab_" + room._id,
        panel, tab;

    if($("#" + panel_id).length > 0){
        return false;
    }

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
            }
        };
        return Template.panel({
            panel_title: "panel " + room.name,
            panel_id: panel_id,
            panel_type: "room",
            chats: Chat.find({room_id: room._id})
        });
    }),

    tab = Meteor.ui.render(function(){
        Template.panel_tab.events = {
            "click .quit": function(e){
                $("#" + panel_id).detach();
                $("#" + panel_tab_id).detach();
                Room.update({_id: room._id}, {$pull: {"entered_users": Session.get("user_id")}});
                amplify.store("last_session", _.without(last_session, panel_id));

                return false;
            }
        };
        return Template.panel_tab({
            panel_title: room.name,
            panel_tab_id: panel_tab_id,
            panel_id: panel_id
        });
    });

    panels.append(panel);
    tabs.append(tab);

    Room.update({_id: room._id}, {$addToSet: {entered_users: Session.get("user_id")}});
    amplify.store("last_session", _.union(last_session, [panel_id]));

//    Meteor.subscribe("chats", room._id);

    return true;
}
Template.rooms.rooms = function(){
    return Room.find();
};
Template.rooms.events = {
    'click .tile-body': function(e){
        enter_room(this);
        e.preventDefault();
    },
    "mouseenter .tile-body": function(e){
        var tile = $(e.target).parent(),
            room_name = tile.find(".room-name"),
            enter = tile.find(".enter-room"),
            enter_inner = enter.find(".inner");

        enter_inner.css("left", tile.width() - enter_inner.width() - room_name.width());

        enter.addClass("show");
    },
    "mouseleave .tile-body": function(e){
        var enter = $(e.target).parent().find(".enter-room");

        enter.removeClass("show");
    },

    "afterinsert": function(e){
        console.log(e);
    }
};
Template.rooms.user_count = function(){
    return this.entered_users ? this.entered_users.length : 0;
};
Template.rooms.latest_chat = function(){
    var chat = Chat.findOne({room_id: this._id}, {sort: [["updated", "desc"]]}),
    user;
    if(chat){
        user = User.findOne({_id: chat.user_id});
        return {
            content: chat.content,
            name: user.name
        };
    }
};


//////// users //////////
function chat_user(user){
    var panels = $(".panels"),
        tabs = $(".panel-tabs"),
        panel_id = "panel_" + user._id,
        panel_tab_id = "panel_tab_" + user._id,
        panel, tab;

    panel = Meteor.ui.render(function(){
        Template.panel.events = {
            "keyup .chat-text": function(e){
                if(e.ctrlKey && e.keyCode == 13 && e.target.value){
                    Message.insert({
                        to_user_id: user._id,
                        content: e.target.value,
                        user_id: Session.get("user_id"),
                        updated: moment().utc().format()
                    });
                    e.target.value = "";
                }
            }
        };
        return Template.panel({
            panel_title: "panel " + user.name,
            panel_id: panel_id,
            panel_type: "message",
            chats: Message.find({$or: [
                {to_user_id: Session.get("user_id"), user_id: user._id},
                {user_id: Session.get("user_id"), to_user_id: user._id}
            ]})
        });
    });

    tab = Meteor.ui.render(function(){
        Template.panel_tab.events = {
            "click .quit": function(e){
                $("#" + panel_id).detach();
                $("#" + panel_tab_id).detach();
                amplify.store("last_session", _.without(last_session, panel_id));

                return false;
            }
        };

        return Template.panel_tab({
            panel_title: user.name,
            panel_id: panel_id,
            panel_tab_id: panel_tab_id
        });
    });

    panels.append(panel);
    tabs.append(tab);

    amplify.store("last_session", _.union(last_session, [panel_id]));

    Meteor.subscribe("messages", Session.get("user_id"), user._id);
}
Template.users.users = function(){
    return User.find({
        "online": true
    });
};
Template.users.events = {
    "click .chat": function(e){
        chat_user(this);
        e.preventDefault();
    }
};


//////// chats //////////
Template.chat_item.updated = function(){
    return moment(this.updated).local().format();
};
Template.chat_item.username = function(){
    return User.findOne({_id: this.user_id}).name;
};
Template.chat_item.content = function(){
    return this.content.replace(/(\#.*?\#)/ig, '<a class=\"chat-tags\" href="#">$1</a>');
};

/////// search chats /////////
Template.search_chats.show = function(){
    return true;
};
