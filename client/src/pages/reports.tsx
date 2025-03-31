import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InvigilationReport } from "@/components/invigilation-report";
import { 
  BarChart3, 
  PieChart, 
  Calendar, 
  Download,
  Filter,
  FileText,
  ClipboardList
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as PieChartRecharts,
  Pie,
  Cell
} from "recharts";

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

interface Faculty {
  id: number;
  name: string;
  username: string;
  department?: string;
}

interface Duty {
  id: number;
  examId: number;
  facultyId: number;
  room: string;
  status: string;
}

export default function Reports() {
  const [reportType, setReportType] = useState("exam");
  const [filterExamType, setFilterExamType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch faculty
  const { data: faculty = [], isLoading: isLoadingFaculty } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  // Fetch all duties
  const { data: allDuties = [], isLoading: isLoadingDuties } = useQuery<Duty[]>({
    queryKey: ["/api/duties/all"],
    placeholderData: [],
  });
  
  // Filter exams based on selected filters
  const filteredExams = exams.filter(exam => {
    // Filter by exam type
    if (filterExamType !== "all" && exam.examType !== filterExamType) {
      return false;
    }
    
    // Filter by month
    if (filterMonth !== "all") {
      const examMonth = new Date(exam.date).getMonth() + 1;
      if (examMonth.toString() !== filterMonth) {
        return false;
      }
    }
    
    return true;
  });

  // Generate exam by type data for pie chart
  const examByTypeData = exams.reduce((acc: any[], exam) => {
    const existingType = acc.find(item => item.name === exam.examType);
    if (existingType) {
      existingType.value += 1;
    } else {
      acc.push({ name: exam.examType, value: 1 });
    }
    return acc;
  }, []);

  // Generate exam by month data for bar chart
  const examByMonthData = exams.reduce((acc: any[], exam) => {
    const month = new Date(exam.date).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.name === month);
    if (existingMonth) {
      existingMonth.count += 1;
    } else {
      acc.push({ name: month, count: 1 });
    }
    return acc;
  }, []);

  // Sort by month name
  examByMonthData.sort((a, b) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(a.name) - months.indexOf(b.name);
  });

  // Faculty duty count data
  const facultyDutyData = faculty
    .filter(f => f.name !== "Admin")
    .map(f => {
      const dutyCount = allDuties.filter(duty => duty.facultyId === f.id).length;
      return {
        name: f.name,
        count: dutyCount
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 faculty by duty count

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-neutral-800 md:text-xl">
                Reports & Analytics
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
        
        {/* Reports content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === "analytics" ? "default" : "outline"} 
                onClick={() => setActiveTab("analytics")}
                className="flex items-center"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button 
                variant={activeTab === "reports" ? "default" : "outline"}
                onClick={() => setActiveTab("reports")}
                className="flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
                Invigilation Report
              </Button>
            </div>
          </div>

          {activeTab === "analytics" ? (
            <>
              {/* Analytics Filters */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto">
                    <div className="w-full sm:w-40">
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exam">Exam Statistics</SelectItem>
                          <SelectItem value="faculty">Faculty Statistics</SelectItem>
                          <SelectItem value="duty">Duty Statistics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-40">
                      <Select value={filterExamType} onValueChange={setFilterExamType}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Exam Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="T1">T1</SelectItem>
                          <SelectItem value="T4">T4</SelectItem>
                          <SelectItem value="Semester">Semester</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-40">
                      <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Dashboard Content */}
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard 
                    icon={<BarChart3 size={24} className="text-primary-600" />} 
                    title="Total Exams" 
                    value={exams.length.toString()}
                    color="primary"
                  />
                  <StatCard 
                    icon={<PieChart size={24} className="text-secondary-600" />} 
                    title="Total Faculty" 
                    value={(faculty.length - 1).toString()} // Excluding admin
                    color="secondary"
                  />
                  <StatCard 
                    icon={<Calendar size={24} className="text-green-600" />} 
                    title="Assigned Duties" 
                    value={allDuties.length.toString()}
                    color="green"
                  />
                  <StatCard 
                    icon={<ClipboardList size={24} className="text-yellow-600" />} 
                    title="Completion Rate" 
                    value={`${Math.round((exams.filter(e => e.status === 'completed').length / (exams.length || 1)) * 100)}%`}
                    color="yellow"
                  />
                </div>

                {/* Charts and Reports */}
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="exams">Exam Distribution</TabsTrigger>
                    <TabsTrigger value="faculty">Faculty Load</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Exam by Type Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Exam Distribution by Type</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChartRecharts>
                                <Pie
                                  data={examByTypeData}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {examByTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChartRecharts>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Exam by Month Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Monthly Exam Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={examByMonthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Exams" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Exams Tab */}
                  <TabsContent value="exams">
                    <Card>
                      <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-neutral-50">
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Rooms</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingExams ? (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                                    Loading exams...
                                  </td>
                                </tr>
                              ) : filteredExams.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                                    No exams match the selected filters
                                  </td>
                                </tr>
                              ) : (
                                filteredExams.map((exam) => (
                                  <tr key={exam.id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-neutral-800">{exam.name}</div>
                                      <div className="text-xs text-neutral-500">{exam.courseCode}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{exam.examType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{formatDate(exam.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{exam.startTime} - {exam.endTime}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{exam.totalRooms}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800 capitalize">{exam.status}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Faculty Tab */}
                  <TabsContent value="faculty">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Faculty Duty Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={facultyDutyData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Duties Assigned" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Faculty Duty Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-neutral-50">
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Faculty Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Department</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Total Duties</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Completion Rate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {isLoadingFaculty ? (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                                      Loading faculty data...
                                    </td>
                                  </tr>
                                ) : faculty.filter(f => f.name !== "Admin").length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                                      No faculty data available
                                    </td>
                                  </tr>
                                ) : (
                                  faculty.filter(f => f.name !== "Admin").map((f) => {
                                    const facultyDuties = allDuties.filter(duty => duty.facultyId === f.id);
                                    const completedDuties = facultyDuties.filter(duty => duty.status === 'completed');
                                    const completionRate = facultyDuties.length ? Math.round((completedDuties.length / facultyDuties.length) * 100) : 0;
                                    
                                    return (
                                      <tr key={f.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{f.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{f.department || 'CSE'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{facultyDuties.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{completionRate}%</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            // Invigilation Reports Tab
            <InvigilationReport />
          )}
        </main>
      </div>
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