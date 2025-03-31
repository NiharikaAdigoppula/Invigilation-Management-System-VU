import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useUserStore } from "@/hooks/use-user-store";

interface RequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Exam {
  id: number;
  name: string;
  date: string;
}

export function RequestForm({ isOpen, onClose }: RequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    requestType: "schedule_change",
    examId: 0,
    reason: "",
    facultyName: user?.name || "",
  });

  // Fetch exams for dropdown
  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    enabled: isOpen,
  });

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "examId" ? parseInt(value) : value,
    }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      reason: e.target.value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const requestData = {
        ...formData,
        facultyId: user.id,
      };

      await apiRequest("POST", "/api/requests", requestData);
      
      queryClient.invalidateQueries({ queryKey: [`/api/requests/faculty/${user.id}`] });
      
      toast({
        title: "Success",
        description: "Request submitted successfully",
      });
      
      // Reset form and close dialog
      setFormData({
        requestType: "schedule_change",
        examId: 0,
        reason: "",
        facultyName: user?.name || "",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Request</DialogTitle>
          <DialogDescription>
            Submit a request regarding your invigilation duties.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="requestType">Request Type</Label>
              <Select 
                onValueChange={(value) => handleSelectChange("requestType", value)}
                defaultValue={formData.requestType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule_change">Schedule Change</SelectItem>
                  <SelectItem value="room_change">Room Change</SelectItem>
                  <SelectItem value="substitute">Substitute Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examId">Exam</Label>
              <Select 
                onValueChange={(value) => handleSelectChange("examId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.name} ({new Date(exam.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facultyName">Faculty Name</Label>
              <Input
                id="facultyName"
                name="facultyName"
                value={formData.facultyName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                rows={4}
                value={formData.reason}
                onChange={handleTextAreaChange}
                required
                placeholder="Please provide details about your request"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.examId}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
