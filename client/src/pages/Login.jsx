import {
  Link,
  Form,
  redirect,
  useNavigation,
  useActionData,
} from "react-router-dom";
import React from "react";
import Wrapper from "../assets/wrappers/RegisterAndLoginPage";
import { FormRow, Logo } from "../assets/components";
import customFetch from "../utils/customFetch";
import { toast } from "react-toastify";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  // ตรวจสอบความยาวของ password
  if (!data.password || data.password.length < 1) {
    return { msg: "Password too short" };
  }
  
  try {
    // ส่งข้อมูลไปที่ API เพื่อทำการ login
    await customFetch.post("/auth/login", data);
    toast.success("เข้าสู่ระบบเรียบร้อยแล้ว");
    return redirect("/dashboard");
  } catch (error) {
    // ดึงข้อความ error จาก response หากมี หรือใช้ข้อความเริ่มต้น
    const errorMsg =
      error?.response?.data?.msg || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    toast.error(errorMsg);
    return { msg: errorMsg };
  }
};


const Login = () => {
  const errors = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return (
    <Wrapper>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] to-[#a6ddffd1]">
      <Form method="post" className="form">
        <Logo />
        <h4>Login</h4>
        {errors && <p style={{ color: "red" }}>{errors.msg}</p>}
        <FormRow type="username" name="username" defaultValue="" />
        <FormRow type="password" name="password" defaultValue="" />
        <button type="submit" className="btn btn-block" disabled={isSubmitting}>
          {isSubmitting ? "submitting..." : "submit"}
        </button>
        <p>
          {/* Not a Member yet?
          <Link to="/register" className="member-btn">
            Register
          </Link> */}
        </p>
      </Form>
      </div>
    </Wrapper>
  );
};

export default Login;
