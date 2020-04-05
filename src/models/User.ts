import mongoose, {Schema, Document, Model} from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import {IUser, IUserSchema} from "../Interfaces/User/User";

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    tokens: [{
        access: {
            type: String,
            require: true
        },
        token: {
            type: String,
            require: true
        }
    }],
}, { usePushEach: true });

UserSchema.statics.findByCredentials = function (email: string, password: string) {
    const User = this;

    return User.findOne({ email }).then((user: IUser) => {
        if (!user) {
            return Promise.reject('User not found!');
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject(`Passwords don't match!`);
                }
            })
        });

    });
};

UserSchema.statics.findByToken = function (token: string) {
    const User = this;
    let decoded: any;

    try {
        decoded = jwt.verify(token, `${process.env.JWT_SECRET}`);
    } catch (e) {
        return Promise.reject('Unauthorized.');
    }

    return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    })
};

UserSchema.methods.generateAuthToken = function () {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({ _id: user._id.toHexString(), access }, `${process.env.JWT_SECRET}`).toString();

    user.tokens.push({ access, token });

    return user.save().then(() => {
        return token;
    })
};

UserSchema.methods.removeToken = function (token: string) {
    const user = this;

    return user.update({
        $pull: {
            tokens: {
                token: token
            }
        }
    });
};

UserSchema.pre('save', function (next) {
        const user: any = this;
        if (user.isModified('password')) {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(user.password, salt, (err, hash) => {
                    user.password = hash;
                    next();
                })
            })
        } else {
            next();
        }
});

const UserModel = mongoose.model<IUser, IUserSchema>('User', UserSchema);

export default UserModel;