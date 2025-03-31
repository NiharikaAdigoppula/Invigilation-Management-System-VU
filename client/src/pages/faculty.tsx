import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, Mail, Phone, Calendar, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Faculty {
  id: number;
  name: string;
  username: string;
}

interface TimetableEntry {
  id: number;
  facultyId: number;
  day: string;
  timeSlot: string;
  subject: string;
}

export default function Faculty() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showTimetable, setShowTimetable] = useState(false);

  // Fetch faculty
  const { data: faculty = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  // Fetch timetable for selected faculty
  const { data: timetable = [], isLoading: isLoadingTimetable } = useQuery<TimetableEntry[]>({
    queryKey: [`/api/timetable/${selectedFaculty?.id}`],
    enabled: !!selectedFaculty,
  });

  // Filter faculty based on search term
  const filteredFaculty = faculty.filter((f) => 
    f.name !== "Admin" && // Exclude admin user
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle view timetable
  const handleViewTimetable = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setShowTimetable(true);
  };

  // Group timetable entries by day
  const timetableByDay = timetable.reduce((acc, entry) => {
    const day = entry.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort days in order: Monday, Tuesday, etc.
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Handle sorting for MON, TUE format
  const dayMap: Record<string, string> = {
    "MON": "Monday",
    "TUE": "Tuesday",
    "WED": "Wednesday",
    "THU": "Thursday",
    "FRI": "Friday",
    "SAT": "Saturday",
    "SUN": "Sunday"
  };

  const getDayForSorting = (day: string) => {
    return dayMap[day] || day;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-neutral-800 md:text-xl">
                Faculty Management
              </h1>
            </div>
            <div className="flex items-center">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="mr-2 hidden text-sm md:block">Welcome, Admin</span>
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    AD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Faculty content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Faculty List</h2>
            <div className="flex space-x-2 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search faculty..."
                  className="w-full sm:w-[250px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Faculty grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-neutral-500">
                Loading faculty...
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="col-span-full text-center py-8 text-neutral-500">
                No faculty found
              </div>
            ) : (
              filteredFaculty.map((faculty) => (
                <Card key={faculty.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{faculty.name}</h3>
                        <p className="text-sm text-neutral-500">Faculty ID: {faculty.id}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                            <span>{faculty.username}@vignanuniversity.edu</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                            <span>+91 9876543210</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xl font-bold">
                        {faculty.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewTimetable(faculty)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        View Duties
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Timetable Dialog */}
      <Dialog open={showTimetable} onOpenChange={setShowTimetable}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFaculty?.name}'s Schedule</DialogTitle>
            <DialogDescription>
              View faculty's teaching schedule and availability
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            {isLoadingTimetable ? (
              <div className="text-center py-8 text-neutral-500">
                Loading timetable...
              </div>
            ) : timetable.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No schedule information available
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(timetableByDay)
                  .sort((a, b) => {
                    return dayOrder.indexOf(getDayForSorting(a)) - dayOrder.indexOf(getDayForSorting(b));
                  })
                  .map((day) => (
                    <div key={day} className="border rounded-md overflow-hidden">
                      <div className="bg-primary-50 px-4 py-2 font-medium">
                        {dayMap[day] || day}
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-neutral-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Time Slot</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Subject</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timetableByDay[day]
                            .sort((a, b) => {
                              const timeA = a.timeSlot.split(' - ')[0];
                              const timeB = b.timeSlot.split(' - ')[0];
                              return timeA.localeCompare(timeB);
                            })
                            .map((entry) => (
                              <tr key={entry.id} className="border-b last:border-0">
                                <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.timeSlot}</td>
                                <td className="px-4 py-2 text-sm">{entry.subject}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTimetable(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
