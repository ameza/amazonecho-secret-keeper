var mongoose = require('mongoose');

var SecretSchema = new mongoose.Schema({
    Text: { type: String, required: true },
    Password: { type: String },
    CreatedDate: { type: Date, required: true }
});


SecretSchema.statics.random = function(callback) {
    this.find({Password:""}).count(function(err, count) {
        if (err) {
            return callback(err);
        }
        var rand = Math.floor(Math.random() * count);
        this.findOne({Password:""}).skip(rand).exec(callback);
    }.bind(this));
};


module.exports = {
    Secret: mongoose.model('Secret', SecretSchema),
};