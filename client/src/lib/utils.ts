import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date function
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  });
}

// Get day of week from date
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Format time function (convert 24h to 12h format)
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Check if two time ranges overlap
export function hasTimeOverlap(
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean {
  // Convert times to minutes since midnight
  const [h1, m1] = startTime1.split(':').map(Number);
  const [h2, m2] = endTime1.split(':').map(Number);
  const [h3, m3] = startTime2.split(':').map(Number);
  const [h4, m4] = endTime2.split(':').map(Number);
  
  const start1 = h1 * 60 + m1;
  const end1 = h2 * 60 + m2;
  const start2 = h3 * 60 + m3;
  const end2 = h4 * 60 + m4;
  
  // Check for overlap
  return (start1 < end2 && end1 > start2);
}

// Format status to display with proper capitalization and spaces
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Generate status badge class based on status
export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'assigned':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
    case 'completed':
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'rejected':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Parse time slot (e.g. "10:20 - 11:15")
export function parseTimeSlot(timeSlot: string): { start: string; end: string } {
  const [start, end] = timeSlot.split(' - ');
  return { start, end };
}
