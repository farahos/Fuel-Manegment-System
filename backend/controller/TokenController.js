import User from "../model/User.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/emailService.js";

// ✅ 1. Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Emailka geli",
      });
    }

    // Hubi in user-ku jiro
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User-kaan ma helin",
      });
    }

    // Samee reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // U dir email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      
      res.status(200).json({
        success: true,
        message: "Email resetka ayaa kuu diray emailkaaga",
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Qalad ka dhacay dirista emailka",
      });
    }
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: "Qalad ka dhacay server",
    });
  }
};

// ✅ 2. Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password cusub geli",
      });
    }

    // Hash token-ka si aad u is barbar dhigtid database-ka
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Raadi user-ka token-ka iyo waqtiga saxda ah
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token-ku waa invalid ama wuu dhacay",
      });
    }

    // Beddel password-ka
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password-ka waa la beddelay",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Qalad ka dhacay server",
    });
  }
};