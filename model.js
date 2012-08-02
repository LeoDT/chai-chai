//User -- {name: string}
User = new Meteor.Collection("users");

//Room -- {name: string}
Room = new Meteor.Collection("rooms");

//Chat -- {room_id: string, user_id: string, content: string}
Chat = new Meteor.Collection("chats");

//Message -- {from_user_id: sreing, to_user_id: string, content: string}
Message = new Meteor.Collection("messages");

get_u2u_chats = function(user_id_1, user_id_2){
    return Message.find({$or: [
        {to_user_id: user_id_1, user_id: user_id_2},
        {to_user_id: user_id_2, user_id: user_id_1}
    ]});
};
