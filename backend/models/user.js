const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // ✅ Only require password if googleId is not set
      },
    },
    googleId: {
      type: String, // ✅ Add this to track Google users
    },
    bio: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔥 Define the generateAuthToken method properly
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.JWTPRIVATEKEY || "defaultSecret",
    { expiresIn: "1h" }
  );
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;