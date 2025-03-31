import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Faculty schema
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  department: text("department").notNull(),
  role: text("role").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertFacultySchema = createInsertSchema(faculty).pick({
  name: true,
  username: true,
  password: true,
  department: true,
  role: true,
  isAdmin: true,
});

// Enum for faculty roles
export const roleEnum = z.enum(["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Other"]);
export type Role = z.infer<typeof roleEnum>;

// Enum for departments
export const departmentEnum = z.enum([
  "CSE",
  "Computer Science", 
  "Information Technology", 
  "Electronics", 
  "Electrical", 
  "Mechanical", 
  "Civil", 
  "Physics", 
  "Chemistry", 
  "Mathematics", 
  "Other"
]);
export type Department = z.infer<typeof departmentEnum>;

// Timetable entry schema
export const timetable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").notNull(),
  day: text("day").notNull(),
  timeSlot: text("time_slot").notNull(),
  subject: text("subject").notNull(),
});

export const insertTimetableSchema = createInsertSchema(timetable).pick({
  facultyId: true,
  day: true,
  timeSlot: true,
  subject: true,
});

// Exam schema
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseCode: text("course_code").notNull(),
  examType: text("exam_type").notNull(), // T1, T4, Semester, Other
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  totalRooms: integer("total_rooms").notNull(),
  invigilatorsPerRoom: integer("invigilators_per_room").notNull().default(1),
  rooms: jsonb("rooms").$type<string[]>().notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, ready, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

// Invigilation duty schema
export const duties = pgTable("duties", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  room: text("room").notNull(),
  status: text("status").notNull().default("assigned"), // assigned, completed, canceled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDutySchema = createInsertSchema(duties).omit({
  id: true,
  createdAt: true,
});

// Faculty request schema
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").notNull(),
  facultyName: text("faculty_name"),
  requestType: text("request_type").notNull(), // schedule_change, room_change, substitute, other
  examId: integer("exam_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type Timetable = typeof timetable.$inferSelect;
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Duty = typeof duties.$inferSelect;
export type InsertDuty = z.infer<typeof insertDutySchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

// Enum types
export const examTypeEnum = z.enum(["T1", "T4", "Semester", "Other"]);
export type ExamType = z.infer<typeof examTypeEnum>;

export const requestTypeEnum = z.enum(["schedule_change", "room_change", "substitute", "other"]);
export type RequestType = z.infer<typeof requestTypeEnum>;

export const statusEnum = z.enum(["pending", "ready", "completed", "assigned", "approved", "rejected", "canceled"]);
export type Status = z.infer<typeof statusEnum>;
