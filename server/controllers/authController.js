// authController.js
import { StatusCodes } from "http-status-codes";
import User from "../models/UserModel.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { UnauthenticatedError } from "../errors/customError.js";
import { createJWT } from "../utils/tokenUtils.js";

export const register = async (req, res) => {
  const hashedPassword = await hashPassword(req.body.password);
  req.body.password = hashedPassword;

  const user = await User.create(req.body);
  res.status(StatusCodes.CREATED).json({ msg: "user created" });
};

export const login = async (req, res) => {
  console.log("Login request received:", req.body);

  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    console.log("user not found");
    throw new UnauthenticatedError("ชื่อผู้ใช้ไม่ถูกต้อง");
  }

  const isValidUser = await comparePassword(req.body.password, user.password);
  if (!isValidUser) {
    console.log("Invalid password");
    throw new UnauthenticatedError("รหัสผ่านไม่ถูกต้อง");
  }

  const token = createJWT({ userId: user._id });
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    secure: process.env.NODE_ENV === "production",
  });

  res.status(StatusCodes.OK).json({ msg: "เข้าสู่ระบบสำเร็จ" });
};

export const logout = (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "ออกจากระบบสำเร็จ" });
};

export const autoLogin = async (req, res) => {
  const { username, passwordFromFrontend } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (passwordFromFrontend === user.password) {
    const token = createJWT({ userId: user._id });

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),  // token หมดอายุหลังจาก 1 วัน
      secure: process.env.NODE_ENV === "production",  // ใช้ secure cookie ถ้าอยู่ในโหมด production
    });

    res.status(StatusCodes.OK).json({ msg: "เข้าสู่ระบบสำเร็จ" });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
};
