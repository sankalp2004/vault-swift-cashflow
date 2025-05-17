
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/authService";
import { User } from "@/types/auth";
import { Wallet, User as UserIcon, LogOut, ShieldCheck } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Wallet size={24} className="text-primary" />
          <span className="font-bold text-xl">DigitalWallet</span>
        </Link>

        <nav>
          {user ? (
            <div className="flex items-center gap-2">
              {user.isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                  className="hidden md:flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Admin</span>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserIcon size={16} />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/wallet")}>
                    My Wallet
                  </DropdownMenuItem>
                  
                  {user.isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="md:hidden">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/register")}>Register</Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
