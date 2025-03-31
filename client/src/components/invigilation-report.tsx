import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Mail,
  Printer,
  Search,
  FileText,
  Filter
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { useQuery } from "@tanstack/react-query";
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

interface DutyWithDetails {
  id: number;
  examId: number;
  facultyId: number;
  room: string;
  status: string;
  exam: Exam;
  faculty: Faculty;
}

declare global {
  interface Window {
    jspdf: any;
  }
}

export function InvigilationReport() {
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDuties, setFilteredDuties] = useState<DutyWithDetails[]>([]);
  const { toast } = useToast();

  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  // Fetch faculty
  const { data: faculty = [], isLoading: isLoadingFaculty } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });

  // Fetch all duties
  const { data: duties = [], isLoading: isLoadingDuties } = useQuery<Duty[]>({
    queryKey: ["/api/duties/all"],
  });

  useEffect(() => {
    if (!isLoadingDuties && !isLoadingExams && !isLoadingFaculty) {
      // Process duties to include exam and faculty details
      const processedDuties = duties.map(duty => {
        const exam = exams.find(e => e.id === duty.examId);
        const facultyMember = faculty.find(f => f.id === duty.facultyId);
        
        return {
          ...duty,
          exam: exam as Exam,
          faculty: facultyMember as Faculty
        };
      }).filter(duty => duty.exam && duty.faculty); // Ensure both exam and faculty exist
      
      // Apply filtering
      const filtered = processedDuties
        .filter(duty => 
          (selectedExam === "all" || duty.examId.toString() === selectedExam) &&
          (searchTerm === "" || 
           duty.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           duty.exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           duty.room.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      
      setFilteredDuties(filtered);
    }
  }, [duties, exams, faculty, selectedExam, searchTerm, isLoadingDuties, isLoadingExams, isLoadingFaculty]);

  const handleGeneratePDF = () => {
    if (filteredDuties.length === 0) {
      toast({
        title: "No data to export",
        description: "Please select an exam with assigned duties",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Group duties by exam
      const dutiesByExam = filteredDuties.reduce((acc, duty) => {
        if (!acc[duty.examId]) {
          acc[duty.examId] = {
            exam: duty.exam,
            duties: []
          };
        }
        acc[duty.examId].duties.push(duty);
        return acc;
      }, {} as Record<number, { exam: Exam, duties: DutyWithDetails[] }>);
      
      // Add report title
      doc.setFontSize(18);
      doc.text("Vignan University", 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text("Invigilation Duty Report", 105, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });
      
      let yOffset = 45;
      
      // For each exam, create a separate section
      Object.values(dutiesByExam).forEach((examGroup, index) => {
        const { exam, duties } = examGroup;
        
        // Add some spacing between exam sections
        if (index > 0) {
          yOffset += 15;
        }
        
        // Exam details
        doc.setFontSize(12);
        doc.text(`Exam: ${exam.name} (${exam.courseCode})`, 14, yOffset);
        yOffset += 7;
        doc.setFontSize(10);
        doc.text(`Type: ${exam.examType}`, 14, yOffset);
        yOffset += 5;
        doc.text(`Date: ${formatDate(exam.date)}`, 14, yOffset);
        yOffset += 5;
        doc.text(`Time: ${exam.startTime} to ${exam.endTime}`, 14, yOffset);
        yOffset += 5;
        doc.text(`Status: ${exam.status.toUpperCase()}`, 14, yOffset);
        yOffset += 10;
        
        // Table for duties
        const tableData = duties.map(duty => [
          duty.room,
          duty.faculty.name,
          duty.faculty.department || "CSE",
          duty.status
        ]);
        
        // @ts-ignore - jspdf-autotable types
        doc.autoTable({
          startY: yOffset,
          head: [['Room', 'Faculty Name', 'Department', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180], textColor: 255 },
          margin: { top: 10 },
        });
        
        // Update yOffset to end of table
        // @ts-ignore - jspdf-autotable types
        yOffset = doc.lastAutoTable.finalY + 10;
        
        // Check if we need a new page
        if (yOffset > 270) {
          doc.addPage();
          yOffset = 20;
        }
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text('Invigilation Management System - Vignan University', 105, 287, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
      }
      
      // Save the PDF
      const filename = selectedExam === "all" 
        ? "all_invigilation_duties.pdf" 
        : `exam_${selectedExam}_duties.pdf`;
      
      doc.save(filename);
      
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    }
  };

  const handleEmailReport = () => {
    // In a real application, this would trigger a server-side email process
    toast({
      title: "Email Feature",
      description: "Email functionality will be implemented in the next phase.",
    });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-2xl">Invigilation Duty Report</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleEmailReport}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center w-full md:w-auto gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium mr-2">Exam:</span>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    {exam.name} ({exam.courseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by faculty, room, or exam..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Report header - visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold text-center">Vignan University</h1>
          <h2 className="text-xl font-semibold text-center mt-2">Invigilation Duty Report</h2>
          <p className="text-center text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
        </div>
        
        {/* Report content */}
        <div className="border rounded-md overflow-hidden">
          {isLoadingDuties || isLoadingExams || isLoadingFaculty ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16">
              <FileText className="h-16 w-16 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium text-neutral-700">No Duties Found</h3>
              <p className="text-neutral-500 mt-2">
                {selectedExam === "all" 
                  ? "No invigilation duties have been assigned yet." 
                  : "No duties assigned for the selected exam."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Faculty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredDuties.map(duty => (
                    <tr key={duty.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-800">{duty.exam.name}</div>
                        <div className="text-xs text-neutral-500">{duty.exam.courseCode}</div>
                        <div>
                          <Badge variant="outline" className="mt-1">{duty.exam.examType}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-800">{duty.faculty.name}</div>
                        <div className="text-xs text-neutral-500">{duty.faculty.department || "CSE"}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {duty.room}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-neutral-800">{formatDate(duty.exam.date)}</div>
                        <div className="text-xs text-neutral-500">{duty.exam.startTime} - {duty.exam.endTime}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={
                          duty.status === "assigned" ? "bg-blue-100 text-blue-800" :
                          duty.status === "completed" ? "bg-green-100 text-green-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {duty.status.charAt(0).toUpperCase() + duty.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Print-only summary section */}
        {filteredDuties.length > 0 && (
          <div className="hidden print:block mt-8">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p>Total duties: {filteredDuties.length}</p>
            <p>Exams covered: {new Set(filteredDuties.map(d => d.examId)).size}</p>
            <p>Faculty assigned: {new Set(filteredDuties.map(d => d.facultyId)).size}</p>
            <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
              <p>Invigilation Management System - Vignan University</p>
              <p>Report generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}