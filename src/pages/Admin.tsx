
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
    } else if (!currentUser.isAdmin) {
      navigate("/wallet");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">Admin Access</AlertTitle>
          <AlertDescription>
            You're viewing the admin dashboard with privileged access to user data and system operations.
          </AlertDescription>
        </Alert>
        
        <AdminDashboard />
      </div>
    </div>
  );
};

export default Admin;
