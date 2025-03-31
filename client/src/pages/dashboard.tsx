import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExamForm } from "@/components/exam-form";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  MessageSquare, 
  ClipboardList, 
  BarChart3, 
  PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusBadgeClass } from "@/lib/utils";

interface Exam {
  id: number;
  name: string;
  courseCode: string;
  examType: string;
  date: string;
  startTime: string;
  endTime: string;
  totalRooms: number;
  status: string;
}

interface Request {
  id: number;
  requestType: string;
  createdAt: string;
  status: string;
  faculty: {
    id: number;
    name: string;
  };
  exam: {
    id: number;
    name: string;
    date: string;
  };
  reason: string;
}

export default function Dashboard() {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // Fetch exams
  const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch faculty
  const { data: faculty, isLoading: isLoadingFaculty } = useQuery<any[]>({
    queryKey: ["/api/faculty"],
  });

  // Fetch duties
  const { data: duties, isLoading: isLoadingDuties } = useQuery<any[]>({
    queryKey: ["/api/duties/exam/1"],
  });

  // Fetch requests
  const { data: requests, isLoading: isLoadingRequests } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  // Calculate statistics
  const activeExams = exams?.filter(exam => exam.status !== 'completed')?.length || 0;
  const totalFaculty = faculty?.length || 0;
  const assignedDuties = duties?.length || 0;
  const pendingRequests = requests?.filter(request => request.status === 'pending')?.length || 0;

  const upcomingExams = exams?.slice(0, 3) || [];
  const recentRequests = requests?.filter(request => request.status === 'pending')
    .map(request => ({
      ...request,
      facultyName: request.faculty?.name || 'Unknown Faculty'
    }))
    .slice(0, 3) || [];

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-neutral-800 md:text-xl">
                Invigilation Management System
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
        
        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats overview section */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={<ClipboardList size={24} className="text-primary-600" />} 
              title="Active Exams" 
              value={activeExams.toString()}
              color="primary"
            />
            <StatCard 
              icon={<Users size={24} className="text-secondary-600" />} 
              title="Total Faculties" 
              value={totalFaculty.toString()}
              color="secondary"
            />
            <StatCard 
              icon={<CheckCircle size={24} className="text-green-600" />} 
              title="Assigned Duties" 
              value={`${assignedDuties}/90`}
              color="green"
            />
            <StatCard 
              icon={<MessageSquare size={24} className="text-yellow-600" />} 
              title="Pending Requests" 
              value={pendingRequests.toString()}
              color="yellow"
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-neutral-800">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-auto py-5 border-primary-300 hover:border-primary-400 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsExamModalOpen(true)}
              >
                <PlusCircle size={32} className="text-primary-500" />
                <span className="font-medium text-neutral-800">Create New Exam</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-5 border-primary-300 hover:border-primary-400 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = "/invigilation"}
              >
                <Users size={32} className="text-primary-500" />
                <span className="font-medium text-neutral-800">Assign Invigilation</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-5 border-primary-300 hover:border-primary-400 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = "/reports"}
              >
                <BarChart3 size={32} className="text-primary-500" />
                <span className="font-medium text-neutral-800">Generate Reports</span>
              </Button>
            </div>
          </div>
          
          {/* Upcoming Exams */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Upcoming Exams</h2>
              <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                View All
              </Button>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Rooms</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {isLoadingExams ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                          Loading exams...
                        </td>
                      </tr>
                    ) : upcomingExams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                          No upcoming exams
                        </td>
                      </tr>
                    ) : (
                      upcomingExams.map((exam) => (
                        <tr key={exam.id}>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-medium text-neutral-800">{exam.name}</div>
                            <div className="text-xs text-neutral-500">{exam.courseCode}</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{exam.examType}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{formatDate(exam.date)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{exam.startTime} - {exam.endTime}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">{exam.totalRooms}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <Badge className={getStatusBadgeClass(exam.status)}>
                              {exam.status === 'ready' ? 'Ready' : 
                                exam.status === 'pending' ? 'Pending' : 
                                exam.status === 'completed' ? 'Completed' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <Button variant="link" className="text-primary-600 hover:text-primary-900">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Recent Requests */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Recent Requests</h2>
              <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                View All
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingRequests ? (
                <div className="col-span-full text-center py-4 text-neutral-500">
                  Loading requests...
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="col-span-full text-center py-4 text-neutral-500">
                  No pending requests
                </div>
              ) : (
                recentRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Exam Modal */}
      <ExamForm 
        isOpen={isExamModalOpen} 
        onClose={() => setIsExamModalOpen(false)} 
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

interface RequestCardProps {
  request: Request;
}

function RequestCard({ request }: RequestCardProps) {
  const getRequestIcon = (type: string) => {
    switch (type) {
      case "schedule_change":
        return <LayoutDashboard className="h-6 w-6" />;
      case "room_change":
        return <LayoutDashboard className="h-6 w-6" />;
      case "substitute":
        return <Users className="h-6 w-6" />;
      default:
        return <MessageSquare className="h-6 w-6" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRequestAction = async (action: "Approve" | "Reject" | "View") => {
    if (action === "View") {
      // Handle view action separately if needed
      return;
    }

    const status = action.toLowerCase() === "approve" ? "approved" : "rejected";
    
    try {
      await apiRequest("PUT", `/api/requests/${request.id}`, { status });
      
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
              {getRequestIcon(request.requestType)}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-neutral-800">
              {getRequestTypeLabel(request.requestType)}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {request.faculty?.name || "Unknown"} requesting {request.requestType.replace(/_/g, " ")} for {request.exam?.name || "Unknown"} exam
            </p>
            <div className="mt-2 flex items-center">
              <span className="text-xs text-neutral-500">
                {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
              </span>
              <div className="ml-auto flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-primary-100 text-primary-700 hover:bg-primary-200 h-7 rounded"
                  onClick={() => handleRequestAction("View")}
                >
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-green-100 text-green-700 hover:bg-green-200 h-7 rounded"
                  onClick={() => handleRequestAction("Approve")}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-red-100 text-red-700 hover:bg-red-200 h-7 rounded"
                  onClick={() => handleRequestAction("Reject")}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
