import { jwt_secret } from "../config/config.js";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

/**  REGISTER  **/
export const registerUser = async (req, res) => {
  try {
    const { email, username, password, phone, role } = req.body;

    // check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
       
        { phone: phone}

      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email ka ama Nambarka mid ayaa hore loo diwan galiyay" });
    }

    const userInfo = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      phone,
      // role optional: default = 'user' haddii aan la dirin
      ...(role && { role }),
    });

    await userInfo.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in registering user:", error);
    res.status(500).json({ message: "Error in registering user" });
  }
};

// /**  LOGIN  **/
export const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone: phone }).select(
      "+password"
    );
    if (!user) {
      return res.status(400).json({ message: "phone does not exist" });
    }
    // ✅ Check active status
    if (user.status !== "active") {
      return res.status(403).json({ message: "Akoon kan Active maaha" });
    }


    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const expirein  = 7 * 24 * 60 * 60 * 1000; // 7 days
        // const token = jwt.sign({ _id: isuserExist._id}, jwt_secret, {expirein});
        const token = jwt.sign({ _id: user._id, role: user.role }, jwt_secret, {expiresIn: expirein});
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            maxAge: expirein * 1000 // Convert to milliseconds

        });

        res.status(200).send({...user.toJSON(), expirein});

    }catch(error){
        console.log("Error in logging in user:", error);
        res.status(400).send({message: "Error in logging in user"});
    }
}

// get all users
export const getAllUsers = async (req, res) => {
  try { 
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  } 
};

// // new login function

// export const loginUser = async (req, res) => {
//   try {
//     const { phone, password } = req.body;

//     const user = await User.findOne({ phone }).select("+password");
//     if (!user) {
//       return res.status(400).json({ message: "Phone does not exist" });
//     }

//     
//     const isPasswordCorrect = await user.comparePassword(password);
//     if (!isPasswordCorrect) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     const expirein = 7 * 24 * 60 * 60; // 7 days (in seconds)
//     const token = jwt.sign({ _id: user._id, role: user.role }, jwt_secret, { expiresIn: expirein });

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: false,
//       maxAge: expirein * 1000,
//     });

//     res.status(200).json({ 
//       message: "Login successful",
//       user: {
//         id: user._id,
//         username: user.username,
//         role: user.role,
//       }
//     });
//   } catch (error) {
//     console.log("Error in logging in user:", error);
//     res.status(400).json({ message: "Error in logging in user" });
//   }
// };



// get single user
export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const singleUser = await User.findById(id).select("-password");
    if (!singleUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({  
      success: true,
      data: singleUser
    })
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message
    });
  }
};

// ✅ Approve or activate user (admin only)
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Raadi user-ka
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Haddii user horey u active yahay
    if (user.status === "active") {
      return res.status(400).json({ message: "User is already active" });
    }

    // Update status
    user.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: {
        id: user._id,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: "Error approving user" });
  }
};


// ✅ inactive user (admin only)
export const inactiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Raadi user-ka
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Haddii user horey u active yahay
    if (user.status === "inactive") {
      return res.status(400).json({ message: "User is already active" });
    }

    // Update status
    user.status = "inactive";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User inactived successfully",
      data: {
        id: user._id,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: "Error approving user" });
  }
};

// update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;  
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = role;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  }
  catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
};

// ✅ Update username, phone & password (with old password verification)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phone, oldPassword, newPassword } = req.body;

    // Hel user-ka, password-na ha la soo celiyo si loo hubiyo
    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Username update
    if (username) {
      user.username = username;
    }

    // ✅ Phone update
    if (phone) {
      user.phone = phone;
    }

    // ✅ Password update — hubi in oldPassword uu sax yahay
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({
          message: "Old password is required to set a new password",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Old password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    await user.save();

    const { password, ...userData } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};