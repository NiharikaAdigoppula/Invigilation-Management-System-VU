import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, Clock, Calendar, Bookmark } from "lucide-react";
import { formatDate, getStatusBadgeClass, formatStatus } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RequestForm } from "@/components/request-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

interface Exam {
  id: number;
  name: string;
  courseCode: string;
  examType: string;
  date: string;
  startTime: string;
  endTime: string;
  totalRooms: number;
  invigilatorsPerRoom: number;
  rooms: string[];
  status: string;
}

interface DutyWithExam {
  id: number;
  examId: number;
  facultyId: number;
  room: string;
  status: string;
  createdAt: string;
  exam: {
    id: number;
    name: string;
    courseCode: string;
    date: string;
    startTime: string;
    endTime: string;
    examType: string;
  };
}

interface Faculty {
  id: number;
  name: string;
  username: string;
  department?: string;
}

export default function FacultyDuties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<DutyWithExam | null>(null);
  const { user } = useAuth();

  // Fetch all exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch all faculty
  const { data: faculty = [], isLoading: isLoadingFaculty } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  // Fetch all duties with exams
  const { data: allDuties = [], isLoading: isLoadingDuties } = useQuery<DutyWithExam[]>({
    queryKey: ["/api/duties/all"],
  });

  // Fetch faculty's assigned duties
  const { data: myDuties = [], isLoading: isLoadingMyDuties } = useQuery<DutyWithExam[]>({
    queryKey: [`/api/duties/faculty/${user?.id}`],
    enabled: !!user,
  });

  // Filter duties based on search term
  const filteredAllDuties = allDuties.filter((duty) => 
    duty.exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    duty.exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    duty.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.find(f => f.id === duty.facultyId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    false
  );

  const filteredMyDuties = myDuties.filter((duty) => 
    duty.exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    duty.exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    duty.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    false
  );

  // Handle request for change
  const handleRequestChange = (duty: DutyWithExam) => {
    setSelectedDuty(duty);
    setIsRequestModalOpen(true);
  };

  // Get faculty name by id
  const getFacultyName = (facultyId: number): string => {
    const found = faculty.find(f => f.id === facultyId);
    return found ? found.name : "Unknown Faculty";
  };

  // Check if a date is in the future
  const isFutureDate = (dateString: string): boolean => {
    const examDate = new Date(dateString);
    const today = new Date();
    return examDate > today;
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
                Invigilation Duties
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search duties..."
                  className="w-[200px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <span className="mr-2 hidden text-sm md:block">Welcome, {user?.name}</span>
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {user?.name?.substring(0, 2) || "FU"}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Duties</TabsTrigger>
                <TabsTrigger value="my">My Duties</TabsTrigger>
              </TabsList>
              
              {activeTab === "my" && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setIsRequestModalOpen(true)}
                >
                  <Bookmark className="h-4 w-4" />
                  Request Change
                </Button>
              )}
            </div>
            
            <TabsContent value="all" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-neutral-50">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Faculty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {isLoadingDuties ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                            Loading duties...
                          </td>
                        </tr>
                      ) : filteredAllDuties.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                            No duties found
                          </td>
                        </tr>
                      ) : (
                        filteredAllDuties.map((duty) => (
                          <tr key={duty.id} className={`hover:bg-neutral-50 ${duty.facultyId === user?.id ? 'bg-primary-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-neutral-800">{duty.exam.name}</div>
                              <div className="text-xs text-neutral-500">{duty.exam.courseCode}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
                                <span>{formatDate(duty.exam.date)}</span>
                              </div>
                              <div className="flex items-center text-xs text-neutral-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{duty.exam.startTime} - {duty.exam.endTime}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                              {duty.room}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                              <div className={`${duty.facultyId === user?.id ? 'font-bold text-primary-700' : ''}`}>
                                {getFacultyName(duty.facultyId)}
                                {duty.facultyId === user?.id && <span className="ml-2 text-xs">(You)</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusBadgeClass(duty.status)}>
                                {formatStatus(duty.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="my" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-neutral-50">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {isLoadingMyDuties ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                            Loading your duties...
                          </td>
                        </tr>
                      ) : filteredMyDuties.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                            You have no assigned duties
                          </td>
                        </tr>
                      ) : (
                        filteredMyDuties.map((duty) => (
                          <tr key={duty.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-neutral-800">{duty.exam.name}</div>
                              <div className="text-xs text-neutral-500">{duty.exam.courseCode}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
                                <span>{formatDate(duty.exam.date)}</span>
                              </div>
                              <div className="flex items-center text-xs text-neutral-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{duty.exam.startTime} - {duty.exam.endTime}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                              {duty.room}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusBadgeClass(duty.status)}>
                                {formatStatus(duty.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                              {isFutureDate(duty.exam.date) ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-secondary-600 hover:text-secondary-900"
                                  onClick={() => handleRequestChange(duty)}
                                >
                                  Request Change
                                </Button>
                              ) : (
                                <span className="text-neutral-500">Completed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Request Modal */}
      <RequestForm
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedDuty(null);
        }}
      />
    </div>
  );
}