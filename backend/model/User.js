import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userschema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      
    },
    password: {
      type: String,
      required: true,
      select: false, // password laguma soo celin doono queries default
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    // ✅ Field cusub oo u maamula role-ka
    role: {
      type: String,
      enum: ["admin", "user"], // kaliya labada door ee la ogol yahay
      default: "user",         // user waa default
    },
    // ✅ Ku dar fields cusub ee password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password ka hor save
userschema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method lagu hubiyo password sax ah
userschema.methods.comparePassword = async function (givenPassword) {
  return await bcrypt.compare(givenPassword, this.password);
};
// ✅ Method cusub oo u sameysa reset token
userschema.methods.createPasswordResetToken = function() {
 
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 daqiiqo
  
  return resetToken;
};

const User = mongoose.model("User", userschema);
export default User;
