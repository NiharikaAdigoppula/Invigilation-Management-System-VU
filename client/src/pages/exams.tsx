import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamForm } from "@/components/exam-form";
import { useState } from "react";
import { PlusCircle, Search, Edit, Trash } from "lucide-react";
import { formatDate, getStatusBadgeClass } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  description?: string;
  status: string;
  createdAt: string;
}

export default function Exams() {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch exams
  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Filter exams based on search term
  const filteredExams = exams.filter((exam) => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/exams/${examToDelete.id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      
      setExamToDelete(null);
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
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
                Exams Management
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
        
        {/* Exams content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Examinations</h2>
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
              <Button onClick={() => setIsExamModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Exam
              </Button>
            </div>
          </div>

          {/* Exams table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-neutral-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Rooms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {isLoading ? (
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
                          {exam.examType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                          {formatDate(exam.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                          {exam.startTime} - {exam.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                          <div className="flex items-center space-x-1">
                            <span>{exam.totalRooms}</span>
                            <span className="text-xs text-neutral-500">({exam.rooms.length} assigned)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadgeClass(exam.status)}>
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                              onClick={() => setExamToDelete(exam)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
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

      {/* Create Exam Modal */}
      <ExamForm 
        isOpen={isExamModalOpen} 
        onClose={() => setIsExamModalOpen(false)} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam 
              "{examToDelete?.name}" and all associated invigilation duties.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExam}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
