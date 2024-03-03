import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
})

const postSchema = mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    image: {type: String, required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
}, {timestamps: true})

export const user = mongoose.model("User", userSchema)
export const post = mongoose.model("Post", postSchema)