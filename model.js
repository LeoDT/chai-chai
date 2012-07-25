//User -- {name: string}
User = new Meteor.Collection("users")

//Room -- {name: string}
Room = new Meteor.Collection("rooms")

//Chat -- {room_id: string, user_id: string, content: string}
Chat = new Meteor.Collection("chats")
