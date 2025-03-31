import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InsertTimetable } from '@shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the data structure from the CSV
interface TimetableCSV {
  Faculty: string;
  Day: string;
  'Time Slot': string;
  Subject: string;
}

// Faculty name to ID mapping
const getFacultyId = (facultyMap: Map<string, number>, facultyName: string): number => {
  if (!facultyMap.has(facultyName)) {
    facultyMap.set(facultyName, facultyMap.size + 1);
  }
  return facultyMap.get(facultyName) || 0;
};

// Parse the CSV file and convert to timetable entries
export const parseTimetableCSV = (facultyMap: Map<string, number>): InsertTimetable[] => {
  try {
    const csvPath = path.resolve(__dirname, '../../attached_assets/Time table.csv');
    const csvFile = fs.readFileSync(csvPath, 'utf8');
    
    const { data } = Papa.parse<TimetableCSV>(csvFile, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Transform CSV data to timetable entries
    return data.map((row: TimetableCSV) => {
      const facultyId = getFacultyId(facultyMap, row.Faculty);
      
      return {
        facultyId,
        day: row.Day,
        timeSlot: row['Time Slot'],
        subject: row.Subject,
      };
    });
  } catch (error) {
    console.error('Error parsing timetable CSV:', error);
    return [];
  }
};

// Check if a faculty has a conflict with a given exam time
export const hasTimeConflict = (
  facultySchedule: InsertTimetable[],
  examDay: string,
  examStartTime: string,
  examEndTime: string
): boolean => {
  // Filter schedule for the exam day
  const daySchedule = facultySchedule.filter(entry => entry.day.toLowerCase() === examDay.toLowerCase());
  
  if (daySchedule.length === 0) return false;
  
  // Parse exam times to minutes since midnight for easier comparison
  const [examStartHour, examStartMinute] = examStartTime.split(':').map(Number);
  const [examEndHour, examEndMinute] = examEndTime.split(':').map(Number);
  
  const examStartMinutes = examStartHour * 60 + examStartMinute;
  const examEndMinutes = examEndHour * 60 + examEndMinute;
  
  // Check each schedule entry for overlap
  return daySchedule.some(entry => {
    const [entryStartTime, entryEndTime] = entry.timeSlot.split(' - ');
    
    // Parse schedule times
    const [entryStartHour, entryStartMinute] = entryStartTime.split(':').map(Number);
    const [entryEndHour, entryEndMinute] = entryEndTime ? entryEndTime.split(':').map(Number) : [entryStartHour + 1, entryStartMinute];
    
    const entryStartMinutes = entryStartHour * 60 + entryStartMinute;
    const entryEndMinutes = entryEndHour * 60 + entryEndMinute;
    
    // Check for overlap
    return (
      (examStartMinutes <= entryEndMinutes && examEndMinutes >= entryStartMinutes) ||
      (entryStartMinutes <= examEndMinutes && entryEndMinutes >= examStartMinutes)
    );
  });
};

// Format day string to normalized form
export const normalizeDay = (day: string): string => {
  const days: Record<string, string> = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THU': 'Thursday',
    'FRI': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday',
  };
  
  return days[day] || day;
};
