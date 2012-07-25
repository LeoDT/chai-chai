Meteor.startup(function() {
    if(Room.find().count() < 1){
        var data = [
            {
                name: "default"
            },
            {
                name: "develop"
            },
            {
                name: "blah"
            }
	];
        _.each(data, function(item) {
            Room.insert(item);
        });
    }
});
