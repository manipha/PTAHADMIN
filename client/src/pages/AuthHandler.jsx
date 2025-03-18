import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import customFetch from "../utils/customFetch";

const AuthHandler = () => {
  const navigate = useNavigate();

    // useEffect(() => {
    //   const urlParams = new URLSearchParams(window.location.search);
    //   const userId = urlParams.get("userId");

    //   if (userId) {
    //     customFetch
    //       .post("/auth/auto-login", { userId })
    //       .then((res) => {
    //         navigate("/dashboard");
    //       })
    //       .catch(() => {
    //         navigate("/login");
    //       });
    //   } else {
    //     navigate("/login");
    //   }
    // }, []);

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get("username");
      const password = urlParams.get("password");
    
      if (username && password) {
        customFetch
          .post("/auth/auto-login", { username, passwordFromFrontend :password })
          .then((res) => {
            navigate("/dashboard");
          })
          .catch(() => {
            navigate("/login");
          });
      } else {
        navigate("/login");
      }
    }, []);
    
  return (
    <div className="auth-handler-container">
      <div className="loader"></div>
      <p className="loading-text">กำลังยืนยันตัวตน...</p>
    </div>
  );
};

export default AuthHandler;
