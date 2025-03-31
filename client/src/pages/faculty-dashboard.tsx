import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestForm } from "@/components/request-form";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Calendar, 
  CheckCircle, 
  MessageSquare,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/hooks/use-user-store";
import { formatDate, getStatusBadgeClass, formatStatus } from "@/lib/utils";

interface TimetableEntry {
  id: number;
  facultyId: number;
  day: string;
  timeSlot: string;
  subject: string;
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
  faculty?: {
    id: number;
    name: string;
    department?: string;
  };
}

interface Request {
  id: number;
  requestType: string;
  examId: number;
  reason: string;
  status: string;
  createdAt: string;
  exam: {
    id: number;
    name: string;
    date: string;
  } | null;
}

export default function FacultyDashboard() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUserStore();

  // Fetch faculty's timetable
  const { data: timetable = [], isLoading: isLoadingTimetable } = useQuery<TimetableEntry[]>({
    queryKey: [`/api/timetable/${user?.id}`],
    enabled: !!user,
  });

  // Fetch faculty's duties
  const { data: myDuties = [], isLoading: isLoadingMyDuties } = useQuery<DutyWithExam[]>({
    queryKey: [`/api/duties/faculty/${user?.id}`],
    enabled: !!user,
  });
  
  // Fetch all duties for all faculty
  const { data: allDuties = [], isLoading: isLoadingAllDuties } = useQuery<DutyWithExam[]>({
    queryKey: ["/api/duties/all"],
  });
  
  // Debug the duties data
  useEffect(() => {
    console.log("All duties:", allDuties);
    console.log("My duties:", myDuties);
  }, [allDuties, myDuties]);

  // Fetch faculty's requests
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery<Request[]>({
    queryKey: [`/api/requests/faculty/${user?.id}`],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds to get updates
  });

  // Handle new request submission
  const handleNewRequest = async (examId: number, reason: string) => {
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          reason,
          facultyId: user?.id
        })
      });
      setIsRequestModalOpen(false);
      queryClient.invalidateQueries([`/api/requests/faculty/${user?.id}`]);
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  // Filter for upcoming duties
  const upcomingDuties = myDuties
    .filter(duty => duty.status === 'assigned' && new Date(duty.exam.date) >= new Date())
    .sort((a, b) => new Date(a.exam.date).getTime() - new Date(b.exam.date).getTime())
    .slice(0, 3);

  // Count completed duties
  const completedDutiesCount = myDuties.filter(duty => duty.status === 'completed').length;

  // Count pending requests
  const pendingRequestsCount = requests.filter(request => request.status === 'pending').length;

  // Get recent timetable entries for today and tomorrow
  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

  // Handle shortened day names like MON, TUE
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

  const todayClasses = timetable
    .filter(entry => normalizeDay(entry.day) === todayName)
    .sort((a, b) => {
      const timeA = a.timeSlot.split(' - ')[0];
      const timeB = b.timeSlot.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-neutral-800 md:text-xl">
                Faculty Dashboard
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
        
        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats overview section */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard 
              icon={<Calendar size={24} className="text-primary-600" />} 
              title="Upcoming Duties" 
              value={upcomingDuties.length.toString()}
              color="primary"
            />
            <StatCard 
              icon={<CheckCircle size={24} className="text-green-600" />} 
              title="Completed Duties" 
              value={completedDutiesCount.toString()}
              color="green"
            />
            <StatCard 
              icon={<MessageSquare size={24} className="text-yellow-600" />} 
              title="Pending Requests" 
              value={pendingRequestsCount.toString()}
              color="yellow"
            />
          </div>


          
          {/* Upcoming Invigilation Duties */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Upcoming Invigilation Duties</h2>
              <Link href="/duties">
                <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                  View All Duties
                </Button>
              </Link>
            </div>
            
            {/* Search box for finding duties by faculty name */}
            <div className="mt-2 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by faculty name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Search for duties - if you can't attend an assigned duty, click "Request Change" to notify the admin.
              </p>
            </div>
            
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {isLoadingMyDuties ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                        Loading duties...
                      </td>
                    </tr>
                  ) : upcomingDuties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                        No upcoming invigilation duties
                      </td>
                    </tr>
                  ) : (
                    upcomingDuties.map((duty) => (
                      <tr key={duty.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-neutral-800">{duty.exam.name}</div>
                          <div className="text-xs text-neutral-500">{duty.exam.courseCode} - {duty.exam.examType}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{formatDate(duty.exam.date)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{duty.exam.startTime} - {duty.exam.endTime}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{duty.room}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge className={getStatusBadgeClass(duty.status)}>
                            {formatStatus(duty.status)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <Button 
                            variant="link" 
                            className="text-secondary-600 hover:text-secondary-900"
                            onClick={() => setIsRequestModalOpen(true)}
                          >
                            Request Change
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* All Faculty Invigilation Duties */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">All Faculty Invigilation Duties</h2>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Faculty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {isLoadingAllDuties ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                        Loading all duties...
                      </td>
                    </tr>
                  ) : allDuties.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                        No invigilation duties have been assigned yet
                      </td>
                    </tr>
                  ) : (
                    allDuties
                      .filter(duty => 
                        searchTerm === "" || 
                        (duty.faculty?.name && duty.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .sort((a, b) => new Date(a.exam.date).getTime() - new Date(b.exam.date).getTime())
                      .slice(0, 10) // Show only the 10 most recent duties
                      .map((duty) => (
                        <tr key={duty.id} className={duty.facultyId === user?.id ? 'bg-primary-50' : ''}>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-medium text-neutral-800">{duty.exam.name}</div>
                            <div className="text-xs text-neutral-500">{duty.exam.courseCode} - {duty.exam.examType}</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
                              <span>{formatDate(duty.exam.date)}</span>
                            </div>
                            <div className="flex items-center text-xs text-neutral-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{duty.exam.startTime} - {duty.exam.endTime}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                            {duty.room}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                            <div className={`${duty.facultyId === user?.id ? 'font-bold text-primary-700' : ''}`}>
                              {duty.faculty ? duty.faculty.name : `Faculty ID: ${duty.facultyId}`}
                              {duty.facultyId === user?.id && <span className="ml-2 text-xs">(You)</span>}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
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
          
          {/* My Requests */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Faculty Requests</h2>
              <Button 
                className="bg-primary-600 text-white hover:bg-primary-700"
                onClick={() => setIsRequestModalOpen(true)}
              >
                Put a request to admin
              </Button>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Request Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {isLoadingRequests ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                        Loading requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                        No requests submitted
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-800">
                          {formatStatus(request.requestType)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-neutral-800">
                            {request.reason.length > 60 
                              ? `${request.reason.substring(0, 60)}...` 
                              : request.reason}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge className={getStatusBadgeClass(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Request Modal */}
      <RequestForm
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "primary" | "secondary" | "green" | "yellow";
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorMap = {
    primary: "bg-primary-100",
    secondary: "bg-secondary-100",
    green: "bg-green-100",
    yellow: "bg-yellow-100",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${colorMap[color]} p-3`}>
            {icon}
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-lg font-semibold text-neutral-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
