import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/hooks/use-user-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, Download } from "lucide-react";

interface TimetableEntry {
  id: number;
  facultyId: number;
  day: string;
  timeSlot: string;
  subject: string;
}

export default function FacultySchedule() {
  const { user } = useUserStore();

  // Fetch faculty's timetable
  const { data: timetable = [], isLoading } = useQuery<TimetableEntry[]>({
    queryKey: [`/api/timetable/${user?.id}`],
    enabled: !!user,
  });

  // Day of week mapping
  const dayMap: Record<string, string> = {
    "MON": "Monday",
    "TUE": "Tuesday",
    "WED": "Wednesday",
    "THU": "Thursday",
    "FRI": "Friday",
    "SAT": "Saturday",
    "SUN": "Sunday"
  };

  const normalizeDay = (day: string) => dayMap[day] || day;

  // Group timetable entries by day
  const timetableByDay = timetable.reduce((acc, entry) => {
    const day = normalizeDay(entry.day);
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Define day order for sorting
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-neutral-800 md:text-xl">
                My Teaching Schedule
              </h1>
            </div>
            <div className="flex items-center">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="mr-2 hidden text-sm md:block">Welcome, {user?.name}</span>
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    FU
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Schedule content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Weekly Schedule</h2>
            <div className="flex space-x-2 sm:space-x-4">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Schedule
              </Button>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="py-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-primary-500" />
                Faculty Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Name</p>
                  <p className="text-base">{user?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Faculty ID</p>
                  <p className="text-base">FAC{user?.id.toString().padStart(3, '0')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Department</p>
                  <p className="text-base">Computer Science and Engineering</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Email</p>
                  <p className="text-base">{user?.username}@vignanuniversity.edu</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-8 text-neutral-500">
              Loading schedule...
            </div>
          ) : timetable.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-neutral-500">
                  No schedule information available
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {dayOrder
                .filter(day => timetableByDay[day])
                .map((day) => (
                  <Card key={day} className="overflow-hidden">
                    <CardHeader className="py-3 bg-primary-50">
                      <CardTitle className="text-lg font-semibold text-primary-900">
                        {day}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-neutral-50">
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Time Slot</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Subject</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {timetableByDay[day]
                              .sort((a, b) => {
                                const timeA = a.timeSlot.split(' - ')[0];
                                const timeB = b.timeSlot.split(' - ')[0];
                                return timeA.localeCompare(timeB);
                              })
                              .map((entry) => {
                                // Determine class type from the subject code
                                let classType = "Lecture";
                                if (entry.subject.includes("-T")) {
                                  classType = "Tutorial";
                                } else if (entry.subject.includes("-P") || entry.subject.includes("-L")) {
                                  classType = "Practical";
                                }
                                
                                return (
                                  <tr key={entry.id} className="hover:bg-neutral-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                                      {entry.timeSlot}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-800">
                                      {entry.subject}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                      <Badge variant="outline" className={
                                        classType === "Lecture" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        classType === "Tutorial" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                        "bg-green-50 text-green-700 border-green-200"
                                      }>
                                        {classType}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
