
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import Dashboard from "@/components/wallet/Dashboard";

const Wallet = () => {
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wallet</h1>
        <Dashboard />
      </div>
    </div>
  );
};

export default Wallet;
