import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, X, Search, AlertCircle } from "lucide-react";
import { formatDate, getStatusBadgeClass } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

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
}

interface Assignment {
  facultyId: number;
  room: string;
}

export default function Invigilation() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<number[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch faculty
  const { data: faculty = [], isLoading: isLoadingFaculty } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  // Filter exams based on search term
  const filteredExams = exams.filter((exam) => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignInvigilation = (exam: Exam) => {
    setSelectedExam(exam);
    setShowAssignmentModal(true);
    
    // Initialize assignments array
    const initialAssignments: Assignment[] = [];
    exam.rooms.forEach(room => {
      // For each room, add slots based on invigilatorsPerRoom
      for (let i = 0; i < exam.invigilatorsPerRoom; i++) {
        initialAssignments.push({
          facultyId: 0, // 0 means unassigned
          room
        });
      }
    });
    
    setAssignments(initialAssignments);
  };

  const handleFacultySelect = (facultyId: number, index: number) => {
    const newAssignments = [...assignments];
    newAssignments[index].facultyId = facultyId;
    setAssignments(newAssignments);
  };

  const handleBulkSelection = (facultyId: number) => {
    if (selectedFaculty.includes(facultyId)) {
      setSelectedFaculty(selectedFaculty.filter(id => id !== facultyId));
    } else {
      setSelectedFaculty([...selectedFaculty, facultyId]);
    }
  };

  const handleAutoAssign = () => {
    if (!selectedExam) return;

    // Randomly assign selected faculty to available slots
    const newAssignments = [...assignments];
    const availableFaculty = selectedFaculty.slice();
    
    // Shuffle faculty array
    for (let i = availableFaculty.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableFaculty[i], availableFaculty[j]] = [availableFaculty[j], availableFaculty[i]];
    }
    
    // Assign faculty to slots
    for (let i = 0; i < newAssignments.length; i++) {
      if (availableFaculty.length === 0) break;
      newAssignments[i].facultyId = availableFaculty.pop() as number;
    }
    
    setAssignments(newAssignments);
  };

  const handleSubmitAssignments = async () => {
    if (!selectedExam) return;
    
    // Validate that all slots have faculty assigned
    const unassignedSlots = assignments.filter(a => a.facultyId === 0);
    if (unassignedSlots.length > 0) {
      setError(`There are ${unassignedSlots.length} unassigned invigilation slots.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiRequest("POST", "/api/duties/assign", {
        examId: selectedExam.id,
        assignments
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      
      toast({
        title: "Success",
        description: "Invigilation duties assigned successfully",
      });
      
      setShowAssignmentModal(false);
      setSelectedExam(null);
      setAssignments([]);
      setSelectedFaculty([]);
    } catch (error) {
      console.error("Error assigning duties:", error);
      let errorMessage = "Failed to assign invigilation duties";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                Invigilation Management
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
        
        {/* Invigilation content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Invigilation Duties</h2>
            <div className="flex space-x-2 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search exams..."
                  className="w-full sm:w-[250px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAssigning(!isAssigning)}>
                {isAssigning ? "View Exams" : "Assign Duties"}
              </Button>
            </div>
          </div>

          {isAssigning ? (
            // Assign invigilation view
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingExams ? (
                <div className="col-span-full text-center py-4 text-neutral-500">
                  Loading exams...
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="col-span-full text-center py-4 text-neutral-500">
                  No exams found
                </div>
              ) : (
                filteredExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{exam.name}</h3>
                            <p className="text-sm text-neutral-500">{exam.courseCode}</p>
                          </div>
                          <Badge className={getStatusBadgeClass(exam.status)}>
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div>
                            <span className="text-neutral-500">Date:</span> {formatDate(exam.date)}
                          </div>
                          <div>
                            <span className="text-neutral-500">Type:</span> {exam.examType}
                          </div>
                          <div>
                            <span className="text-neutral-500">Time:</span> {exam.startTime} - {exam.endTime}
                          </div>
                          <div>
                            <span className="text-neutral-500">Rooms:</span> {exam.totalRooms}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-neutral-50 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-neutral-500">Status:</span>
                          <span className="ml-1 font-medium">
                            {exam.status === 'ready' ? (
                              <span className="text-green-600">Duties Assigned</span>
                            ) : (
                              <span className="text-amber-600">Needs Assignment</span>
                            )}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAssignInvigilation(exam)}
                          variant={exam.status === 'ready' ? "outline" : "default"}
                        >
                          {exam.status === 'ready' ? 'Reassign' : 'Assign'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // View exams and duties
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Rooms</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {isLoadingExams ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                          Loading exams...
                        </td>
                      </tr>
                    ) : filteredExams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                          No exams found
                        </td>
                      </tr>
                    ) : (
                      filteredExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-800">{exam.name}</div>
                            <div className="text-xs text-neutral-500">{exam.courseCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                            <Badge variant="outline">{exam.examType}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                            <div>{formatDate(exam.date)}</div>
                            <div className="text-xs text-neutral-500">{exam.startTime} - {exam.endTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                            <div className="flex items-center">
                              <span className="font-medium">{exam.totalRooms}</span>
                              <span className="ml-1 text-xs text-neutral-500">
                                ({exam.rooms.join(", ")})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                            {exam.status === 'ready' ? (
                              <div className="flex items-center text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                <span>Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-amber-600">
                                <X className="h-4 w-4 mr-1" />
                                <span>No</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadgeClass(exam.status)}>
                              {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <Button
                              size="sm"
                              onClick={() => handleAssignInvigilation(exam)}
                              variant={exam.status === 'ready' ? "outline" : "default"}
                            >
                              {exam.status === 'ready' ? 'Reassign' : 'Assign'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Assignment Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Invigilation Duties</DialogTitle>
            <DialogDescription>
              {selectedExam?.name} - {selectedExam?.courseCode} ({formatDate(selectedExam?.date || "")})
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-sm font-medium mb-2">Select Faculty</h3>
              <div className="border rounded-md h-[400px] overflow-y-auto">
                <div className="p-2 border-b bg-neutral-50">
                  <Input 
                    type="search"
                    placeholder="Search faculty..."
                    className="text-sm"
                  />
                </div>
                <div className="p-2">
                  {isLoadingFaculty ? (
                    <div className="text-center py-4 text-neutral-500 text-sm">
                      Loading faculty...
                    </div>
                  ) : faculty.length === 0 ? (
                    <div className="text-center py-4 text-neutral-500 text-sm">
                      No faculty available
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {faculty.filter(f => f.name !== "Admin").map((f) => (
                        <div key={f.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`faculty-${f.id}`} 
                            checked={selectedFaculty.includes(f.id)}
                            onCheckedChange={() => handleBulkSelection(f.id)}
                          />
                          <Label htmlFor={`faculty-${f.id}`} className="text-sm font-normal">
                            {f.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                className="w-full mt-2" 
                onClick={handleAutoAssign}
                disabled={selectedFaculty.length === 0}
              >
                Auto-Assign Selected
              </Button>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium mb-2">Assign Rooms & Invigilators</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b">
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Room</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Invigilator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-4 py-2 text-sm">{assignment.room}</td>
                        <td className="px-4 py-2">
                          <Select 
                            value={assignment.facultyId.toString()}
                            onValueChange={(value) => handleFacultySelect(parseInt(value), index)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">-- Select Faculty --</SelectItem>
                              {faculty.filter(f => f.name !== "Admin").map((f) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                  {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedExam?.examType === "T4" && (
                <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
                  <div className="font-medium">Note for T4 Exams:</div>
                  <p>
                    System will check for timetable conflicts when assigning faculty for T4 exams.
                    Conflicts will be reported during submission.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignments} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
