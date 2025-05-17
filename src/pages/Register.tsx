
import RegisterForm from "@/components/auth/RegisterForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

const Register = () => {
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      navigate("/wallet");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto pt-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
