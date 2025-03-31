import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Faculty } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends Faculty {}
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // If there's no dot, it's a plain password (for testing/dev), do simple comparison
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // Otherwise, it's a hashed password
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Initialize default users for development
async function initializeDefaultUsers() {
  try {
    // Check if admin user exists
    const adminUser = await storage.getFacultyByUsername("admin");
    if (!adminUser) {
      // Create admin user with password "admin123"
      await storage.createFaculty({
        username: "admin",
        password: "admin123", // Will be hashed during creation
        name: "Admin",
        department: "CSE",
        role: "Other",
        isAdmin: true
      });
      console.log("Created default admin user");
    }
    
    // Check if faculty user exists
    const facultyUser = await storage.getFacultyByUsername("faculty");
    if (!facultyUser) {
      // Create faculty user with password "faculty123"
      await storage.createFaculty({
        username: "faculty",
        password: "faculty123", // Will be hashed during creation
        name: "Faculty",
        department: "CSE",
        role: "Assistant Professor",
        isAdmin: false
      });
      console.log("Created default faculty user");
    }
  } catch (error) {
    console.error("Error initializing default users:", error);
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "invigilation-system-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: { 
      secure: false, // set to true if using https
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const faculty = await storage.getFacultyByUsername(username);
        if (!faculty) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        if (!(await comparePasswords(password, faculty.password))) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, faculty);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const faculty = await storage.getFaculty(id);
      done(null, faculty);
    } catch (error) {
      done(error, null);
    }
  });

  // Registration route
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, name, department, role } = req.body;
      
      // Check if username already exists
      const existingFaculty = await storage.getFacultyByUsername(username);
      if (existingFaculty) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password and create new faculty
      const hashedPassword = await hashPassword(password);
      const newFaculty = await storage.createFaculty({
        username,
        password: hashedPassword,
        name,
        department,
        role
      });
      
      // Auto login after registration
      req.login(newFaculty, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json(newFaculty);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error during registration" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    const { username, password, role } = req.body;
    
    // Handle role-based authentication
    if (role === "admin" && username === "admin") {
      // Admin login
      passport.authenticate("local", (err: any, user: Faculty | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
        
        if (!user.isAdmin) {
          return res.status(401).json({ message: "Not authorized as admin" });
        }
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          return res.json(user);
        });
      })(req, res, next);
    } else if (role === "faculty") {
      // Faculty login
      passport.authenticate("local", (err: any, user: Faculty | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
        
        req.login(user, (err: any) => {
          if (err) return next(err);
          return res.json(user);
        });
      })(req, res, next);
    } else {
      return res.status(400).json({ message: "Invalid role selection" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Error during logout" });
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(req.user);
  });
  
  // Initialize default users
  initializeDefaultUsers();
}