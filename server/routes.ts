import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExamSchema, 
  insertDutySchema, 
  insertRequestSchema,
  Faculty,
  Exam,
  Duty 
} from "@shared/schema";
import { parseTimetableCSV, hasTimeConflict } from "./utils/csvParser";
import { ZodError } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Initialize faculty data from CSV
  const facultyMap = new Map<string, number>();
  
  // Faculty routes
  app.get("/api/faculty", async (req: Request, res: Response) => {
    const faculty = await storage.getAllFaculty();
    res.json(faculty);
  });
  
  app.get("/api/faculty/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const faculty = await storage.getFaculty(id);
    
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    
    res.json(faculty);
  });
  
  // Login is handled by auth.ts setupAuth function
  
  // Timetable routes
  app.get("/api/timetable/import", async (req: Request, res: Response) => {
    try {
      // Clear existing timetable entries
      await storage.clearTimetableEntries();
      
      // Parse CSV and create timetable entries
      const timetableEntries = parseTimetableCSV(facultyMap);
      
      // Create faculty entries from the map
      for (const entry of Array.from(facultyMap.entries())) {
        const [name, id] = entry;
        // Skip if faculty already exists
        const existingFaculty = await storage.getFaculty(id);
        if (!existingFaculty) {
          await storage.createFaculty({
            name,
            username: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
            password: "password123", // Default password
            department: "CSE", // Default department
            role: "Assistant Professor" // Default role
          });
        }
      }
      
      // Bulk create timetable entries
      await storage.bulkCreateTimetableEntries(timetableEntries);
      
      res.json({ message: "Timetable data imported successfully", count: timetableEntries.length });
    } catch (error) {
      console.error("Error importing timetable data:", error);
      res.status(500).json({ message: "Failed to import timetable data" });
    }
  });
  
  app.get("/api/timetable/:facultyId", async (req: Request, res: Response) => {
    const facultyId = parseInt(req.params.facultyId);
    const timetable = await storage.getTimetableForFaculty(facultyId);
    res.json(timetable);
  });
  
  // Exam routes
  app.post("/api/exams", async (req: Request, res: Response) => {
    try {
      // For debugging
      console.log("Received exam data:", req.body);
      
      const examData = insertExamSchema.parse(req.body);
      console.log("Parsed exam data:", examData);
      
      const exam = await storage.createExam(examData);
      console.log("Created exam:", exam);
      
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ message: "Invalid exam data", errors: error.errors });
      }
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });
  
  app.get("/api/exams", async (req: Request, res: Response) => {
    const exams = await storage.getAllExams();
    res.json(exams);
  });
  
  app.get("/api/exams/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const exam = await storage.getExam(id);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    res.json(exam);
  });
  
  app.put("/api/exams/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const examData = req.body;
      const updatedExam = await storage.updateExam(id, examData);
      
      if (!updatedExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      res.json(updatedExam);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exam" });
    }
  });
  
  app.delete("/api/exams/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteExam(id);
    
    if (!success) {
      return res.status(404).json({ message: "Exam not found" });
    }
    
    res.json({ message: "Exam deleted successfully" });
  });
  
  // Duty routes
  app.post("/api/duties", async (req: Request, res: Response) => {
    try {
      const dutyData = insertDutySchema.parse(req.body);
      const duty = await storage.createDuty(dutyData);
      res.status(201).json(duty);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid duty data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create duty" });
    }
  });
  
  app.post("/api/duties/assign", async (req: Request, res: Response) => {
    try {
      const { examId, assignments } = req.body;
      
      if (!examId || !assignments || !Array.isArray(assignments)) {
        return res.status(400).json({ message: "Invalid assignment data" });
      }
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Delete existing duties for this exam
      const existingDuties = await storage.getDutiesForExam(examId);
      for (const duty of existingDuties) {
        await storage.deleteDuty(duty.id);
      }
      
      // Create new duties
      const duties = [];
      for (const assignment of assignments) {
        const { facultyId, room } = assignment;
        
        // If exam type is T4, check for timetable conflicts
        if (exam.examType === "T4") {
          const faculty = await storage.getFaculty(facultyId);
          if (!faculty) {
            return res.status(404).json({ message: `Faculty with ID ${facultyId} not found` });
          }
          
          const facultySchedule = await storage.getTimetableForFaculty(facultyId);
          
          // Extract day and time from exam data
          const examDay = new Date(exam.date).toLocaleDateString('en-US', { weekday: 'long' });
          
          // Check for conflict
          if (hasTimeConflict(facultySchedule, examDay, exam.startTime, exam.endTime)) {
            return res.status(400).json({ 
              message: `Faculty ${faculty.name} has a schedule conflict with this exam time` 
            });
          }
        }
        
        const duty = await storage.createDuty({
          examId,
          facultyId,
          room,
          status: "assigned"
        });
        
        duties.push(duty);
      }
      
      // Update exam status to ready
      await storage.updateExam(examId, { status: "ready" });
      
      res.status(201).json({ 
        message: "Duties assigned successfully", 
        count: duties.length,
        duties 
      });
    } catch (error) {
      console.error("Error assigning duties:", error);
      res.status(500).json({ message: "Failed to assign duties" });
    }
  });
  
  app.get("/api/duties/exam/:examId", async (req: Request, res: Response) => {
    const examId = parseInt(req.params.examId);
    const duties = await storage.getDutiesForExam(examId);
    res.json(duties);
  });
  
  app.get("/api/duties/faculty/:facultyId", async (req: Request, res: Response) => {
    const facultyId = parseInt(req.params.facultyId);
    const duties = await storage.getDutiesForFaculty(facultyId);
    
    // Enrich duties with exam data
    const enrichedDuties = await Promise.all(duties.map(async (duty) => {
      const exam = await storage.getExam(duty.examId);
      return {
        ...duty,
        exam
      };
    }));
    
    res.json(enrichedDuties);
  });
  
  // Get all duties with exam details (for admin reporting and faculty views)
  app.get("/api/duties/all", async (req: Request, res: Response) => {
    try {
      // Get all exams and faculty
      const exams = await storage.getAllExams();
      const allFaculty = await storage.getAllFaculty();
      
      // Create a faculty lookup map for faster access
      const facultyMap = new Map();
      for (const faculty of allFaculty) {
        facultyMap.set(faculty.id, faculty);
      }
      
      // Get duties for each exam and combine them with exam details
      const allDuties = [];
      
      for (const exam of exams) {
        const duties = await storage.getDutiesForExam(exam.id);
        
        // Combine each duty with its exam and faculty details
        const enrichedDuties = duties.map(duty => {
          const faculty = facultyMap.get(duty.facultyId);
          
          return {
            ...duty,
            exam,
            faculty: faculty ? {
              id: faculty.id,
              name: faculty.name,
              department: faculty.department
            } : null
          };
        });
        
        allDuties.push(...enrichedDuties);
      }
      
      console.log(`Found ${allDuties.length} duties with ${exams.length} exams`);
      
      res.json(allDuties);
    } catch (error) {
      console.error("Error fetching all duties:", error);
      res.status(500).json({ message: "Failed to fetch duties" });
    }
  });
  
  // Request routes
  app.post("/api/requests", async (req: Request, res: Response) => {
    try {
      // Extract facultyName from the request body but don't validate it with the schema
      const { facultyName, ...dataToValidate } = req.body;
      
      const requestData = insertRequestSchema.parse(dataToValidate);
      
      // Create a new object with validated data plus facultyName
      const combinedData = {
        ...requestData,
        facultyName: facultyName || "",
      };
      
      // Now create the request with the combined data
      const request = await storage.createRequest(combinedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });
  
  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getAllRequests();
      
      // Enrich requests with faculty and exam data
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const faculty = await storage.getFaculty(request.facultyId);
        const exam = await storage.getExam(request.examId);
        
        return {
          ...request,
          faculty: faculty ? { id: faculty.id, name: faculty.name } : null,
          exam: exam ? { id: exam.id, name: exam.name, date: exam.date } : null
        };
      }));
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });
  
  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const request = await storage.getRequest(id);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    res.json(request);
  });
  
  app.get("/api/requests/faculty/:facultyId", async (req: Request, res: Response) => {
    const facultyId = parseInt(req.params.facultyId);
    const requests = await storage.getRequestsForFaculty(facultyId);
    
    // Enrich requests with exam data
    const enrichedRequests = await Promise.all(requests.map(async (request) => {
      const exam = await storage.getExam(request.examId);
      return {
        ...request,
        exam: exam ? { id: exam.id, name: exam.name, date: exam.date } : null
      };
    }));
    
    res.json(enrichedRequests);
  });
  
  app.put("/api/requests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedRequest = await storage.updateRequest(id, { status });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update request" });
    }
  });
  
  // Import timetable on server start and create admin user
  setTimeout(async () => {
    try {
      // Create admin user if it doesn't exist
      const adminExists = await storage.getFacultyByUsername("admin");
      if (!adminExists) {
        await storage.createFaculty({
          name: "Admin User",
          username: "admin",
          password: "admin123", // Default admin password
          department: "CSE",
          role: "Professor",
          isAdmin: true
        });
        console.log("Admin user created");
      }
      
      // Parse CSV and create timetable entries
      const timetableEntries = parseTimetableCSV(facultyMap);
      
      // Create faculty entries from the map (using Array.from for compatibility)
      const facultyEntries = Array.from(facultyMap.entries());
      for (let i = 0; i < facultyEntries.length; i++) {
        const [name, id] = facultyEntries[i];
        // Skip if faculty already exists
        const existingFaculty = await storage.getFaculty(id);
        if (!existingFaculty) {
          await storage.createFaculty({
            name,
            username: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
            password: "password123", // Default password
            department: "CSE", // Default department
            role: "Assistant Professor" // Default role
          });
        }
      }
      
      // Bulk create timetable entries
      await storage.bulkCreateTimetableEntries(timetableEntries);
      
      console.log(`Timetable data imported successfully (${timetableEntries.length} entries)`);
    } catch (error) {
      console.error("Error importing timetable data:", error);
    }
  }, 1000);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
