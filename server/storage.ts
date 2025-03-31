import {
  Faculty,
  InsertFaculty,
  Timetable,
  InsertTimetable,
  Exam,
  InsertExam,
  Duty,
  InsertDuty,
  Request,
  InsertRequest,
} from "@shared/schema";

export interface IStorage {
  // Faculty operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByUsername(username: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  getAllFaculty(): Promise<Faculty[]>;

  // Timetable operations
  createTimetableEntry(entry: InsertTimetable): Promise<Timetable>;
  getTimetableForFaculty(facultyId: number): Promise<Timetable[]>;
  clearTimetableEntries(): Promise<void>;
  bulkCreateTimetableEntries(entries: InsertTimetable[]): Promise<Timetable[]>;

  // Exam operations
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getAllExams(): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;

  // Duty operations
  createDuty(duty: InsertDuty): Promise<Duty>;
  getDuty(id: number): Promise<Duty | undefined>;
  getDutiesForExam(examId: number): Promise<Duty[]>;
  getDutiesForFaculty(facultyId: number): Promise<Duty[]>;
  updateDuty(id: number, duty: Partial<Duty>): Promise<Duty | undefined>;
  deleteDuty(id: number): Promise<boolean>;
  bulkCreateDuties(duties: InsertDuty[]): Promise<Duty[]>;

  // Request operations
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getAllRequests(): Promise<Request[]>;
  getRequestsForFaculty(facultyId: number): Promise<Request[]>;
  updateRequest(id: number, request: Partial<Request>): Promise<Request | undefined>;
}

export class MemStorage implements IStorage {
  private faculties: Map<number, Faculty>;
  private timetables: Map<number, Timetable>;
  private examList: Map<number, Exam>;
  private dutyList: Map<number, Duty>;
  private requestList: Map<number, Request>;
  
  private currentFacultyId: number;
  private currentTimetableId: number;
  private currentExamId: number;
  private currentDutyId: number;
  private currentRequestId: number;

  constructor() {
    this.faculties = new Map();
    this.timetables = new Map();
    this.examList = new Map();
    this.dutyList = new Map();
    this.requestList = new Map();
    
    this.currentFacultyId = 1;
    this.currentTimetableId = 1;
    this.currentExamId = 1;
    this.currentDutyId = 1;
    this.currentRequestId = 1;
    
    // Initialize with admin account
    this.faculties.set(this.currentFacultyId++, {
      id: 1,
      name: "Admin",
      username: "admin",
      password: "admin123", // Will be hashed in real system
      department: "CSE",
      role: "Professor",
      isAdmin: true
    });
  }

  // Faculty operations
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }

  async getFacultyByUsername(username: string): Promise<Faculty | undefined> {
    return Array.from(this.faculties.values()).find(
      (faculty) => faculty.username === username
    );
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentFacultyId++;
    const newFaculty: Faculty = { 
      ...faculty, 
      id,
      isAdmin: faculty.isAdmin ?? false // Ensure isAdmin is a boolean
    };
    this.faculties.set(id, newFaculty);
    return newFaculty;
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }

  // Timetable operations
  async createTimetableEntry(entry: InsertTimetable): Promise<Timetable> {
    const id = this.currentTimetableId++;
    const newEntry: Timetable = { ...entry, id };
    this.timetables.set(id, newEntry);
    return newEntry;
  }

  async getTimetableForFaculty(facultyId: number): Promise<Timetable[]> {
    return Array.from(this.timetables.values()).filter(
      (entry) => entry.facultyId === facultyId
    );
  }

  async clearTimetableEntries(): Promise<void> {
    this.timetables.clear();
    this.currentTimetableId = 1;
  }

  async bulkCreateTimetableEntries(entries: InsertTimetable[]): Promise<Timetable[]> {
    return Promise.all(entries.map(entry => this.createTimetableEntry(entry)));
  }

  // Exam operations
  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.currentExamId++;
    const createdAt = new Date();
    
    // Ensure rooms is a proper string array
    let roomsArray: string[] = [];
    if (exam.rooms) {
      if (Array.isArray(exam.rooms)) {
        roomsArray = exam.rooms.map(String);
      } else if (typeof exam.rooms === 'string') {
        roomsArray = [exam.rooms];
      }
    }
    
    const newExam: Exam = { 
      ...exam, 
      id, 
      createdAt,
      status: exam.status ?? "pending",
      invigilatorsPerRoom: exam.invigilatorsPerRoom ?? 2,
      description: exam.description ?? null,
      rooms: roomsArray
    };
    
    this.examList.set(id, newExam);
    return newExam;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.examList.get(id);
  }

  async getAllExams(): Promise<Exam[]> {
    return Array.from(this.examList.values());
  }

  async updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined> {
    const existingExam = this.examList.get(id);
    if (!existingExam) return undefined;
    
    const updatedExam = { ...existingExam, ...exam };
    this.examList.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.examList.delete(id);
  }

  // Duty operations
  async createDuty(duty: InsertDuty): Promise<Duty> {
    const id = this.currentDutyId++;
    const createdAt = new Date();
    const newDuty: Duty = { 
      ...duty, 
      id, 
      createdAt: createdAt,
      status: duty.status ?? "pending"
    };
    this.dutyList.set(id, newDuty);
    return newDuty;
  }

  async getDuty(id: number): Promise<Duty | undefined> {
    return this.dutyList.get(id);
  }

  async getDutiesForExam(examId: number): Promise<Duty[]> {
    return Array.from(this.dutyList.values()).filter(
      (duty) => duty.examId === examId
    );
  }

  async getDutiesForFaculty(facultyId: number): Promise<Duty[]> {
    return Array.from(this.dutyList.values()).filter(
      (duty) => duty.facultyId === facultyId
    );
  }

  async updateDuty(id: number, duty: Partial<Duty>): Promise<Duty | undefined> {
    const existingDuty = this.dutyList.get(id);
    if (!existingDuty) return undefined;
    
    const updatedDuty = { ...existingDuty, ...duty };
    this.dutyList.set(id, updatedDuty);
    return updatedDuty;
  }

  async deleteDuty(id: number): Promise<boolean> {
    return this.dutyList.delete(id);
  }

  async bulkCreateDuties(duties: InsertDuty[]): Promise<Duty[]> {
    return Promise.all(duties.map(duty => this.createDuty(duty)));
  }

  // Request operations
  async createRequest(request: InsertRequest): Promise<Request> {
    const id = this.currentRequestId++;
    const createdAt = new Date();
    const newRequest: Request = { 
      ...request, 
      id, 
      createdAt: createdAt,
      status: request.status ?? "pending"
    };
    this.requestList.set(id, newRequest);
    return newRequest;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requestList.get(id);
  }

  async getAllRequests(): Promise<Request[]> {
    return Array.from(this.requestList.values());
  }

  async getRequestsForFaculty(facultyId: number): Promise<Request[]> {
    return Array.from(this.requestList.values()).filter(
      (request) => request.facultyId === facultyId
    );
  }

  async updateRequest(id: number, request: Partial<Request>): Promise<Request | undefined> {
    const existingRequest = this.requestList.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...request };
    this.requestList.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
