const mongoose = require("mongoose");
const { Schema } = mongoose;
const { hashSync, compareSync } = require('bcrypt-nodejs');
const validator = require("validator");

mongoose.connect(process.env.MONGODB_URI || 'https://mongodb:27017')
console.log("Connected")

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required!"],
        trim: true,
        validate: {
            validator(email) {
                return validator.isEmail(email);
            },
            message: "{VALUE} is not a valid email!"
        }
    },
    role: {
        type: String,
        trim: true,
        enum: ["admin", "editor", "reader"],
        default: "reader"
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        trim: true,
        minlength: [6, "Password need to be longer!"]
    }
});

UserSchema.pre("save", function(next) {
    if (this.isModified("password")) {
        this.password = this._hashPassword(this.password);
    }
    return next();
});

UserSchema.pre("findOneAndUpdate", function(next) {
    if (this._update.password) {
        this._update.password = hashSync(this._update.password);
    }
    return next();
});

UserSchema.methods = {
    _hashPassword(password) {
        return hashSync(password);
    },
    authenticateUser(password) {
        return compareSync(password, this.password);
    }
};

module.exports = mongoose.model("User", UserSchema);