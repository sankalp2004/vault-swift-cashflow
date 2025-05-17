
import { LoginCredentials, RegisterData, User } from "../types/auth";

// Mock users data store
const USERS_KEY = "digital_wallet_users";
const LOGGED_IN_USER_KEY = "digital_wallet_current_user";

// Mock database helpers
const getUsers = (): Record<string, User & { password: string }> => {
  const usersJson = localStorage.getItem(USERS_KEY);
  if (!usersJson) return {};
  return JSON.parse(usersJson);
};

const saveUsers = (users: Record<string, User & { password: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const mockHashPassword = (password: string): string => {
  // This is NOT secure - just for demo purposes
  // In a real app, you would use bcrypt or another secure hashing method
  return btoa(password + "salt_value");
};

// Auth service implementation
export const authService = {
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson);
  },

  login: async (credentials: LoginCredentials): Promise<User> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const users = getUsers();
    
    // Find user by email
    const userEntry = Object.entries(users).find(
      ([_, user]) => user.email === credentials.email
    );
    
    if (!userEntry) {
      throw new Error("Invalid email or password");
    }
    
    const [userId, userData] = userEntry;
    
    // Verify password (mock hashing for demo)
    if (mockHashPassword(credentials.password) !== userData.password) {
      throw new Error("Invalid email or password");
    }
    
    // Return user without password
    const { password, ...user } = userData;
    
    // Store logged in user
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
    
    return user;
  },

  register: async (data: RegisterData): Promise<User> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Validate
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }
    
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    
    const users = getUsers();
    
    // Check if email exists
    const emailExists = Object.values(users).some(
      (user) => user.email === data.email
    );
    
    if (emailExists) {
      throw new Error("Email already registered");
    }
    
    // Create new user
    const id = `user_${Date.now()}`;
    const newUser: User & { password: string } = {
      id,
      name: data.name,
      email: data.email,
      password: mockHashPassword(data.password),
      isAdmin: false
    };
    
    // If no users exist, make this user an admin
    if (Object.keys(users).length === 0) {
      newUser.isAdmin = true;
    }
    
    // Save user
    users[id] = newUser;
    saveUsers(users);
    
    // Return user without password
    const { password, ...user } = newUser;
    
    // Auto login
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
    
    return user;
  },

  logout: () => {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.isAdmin || false;
  }
};
