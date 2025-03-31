import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { X, Plus } from "lucide-react";

interface ExamFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExamForm({ isOpen, onClose }: ExamFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<string[]>(["N-401", "N-402"]);
  const [newRoom, setNewRoom] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    courseCode: "",
    examType: "T1",
    date: "",
    startTime: "",
    endTime: "",
    totalRooms: 2,
    invigilatorsPerRoom: 1,
    description: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRoom = () => {
    if (newRoom && !rooms.includes(newRoom)) {
      setRooms([...rooms, newRoom]);
      setNewRoom("");
    }
  };

  const handleRemoveRoom = (room: string) => {
    setRooms(rooms.filter((r) => r !== room));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Make sure totalRooms and invigilatorsPerRoom are numbers, not strings
      const examData = {
        ...formData,
        rooms,
        totalRooms: Number(formData.totalRooms),
        invigilatorsPerRoom: Number(formData.invigilatorsPerRoom),
        status: "pending" // Add this to match the schema
      };

      console.log("Submitting exam data:", examData);

      const response = await apiRequest("POST", "/api/exams", examData);
      const result = await response.json();
      console.log("Exam creation result:", result);
      
      // Force refetch the exams list
      await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      await queryClient.refetchQueries({ queryKey: ["/api/exams"] });
      
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      
      // Reset form and close dialog
      setFormData({
        name: "",
        courseCode: "",
        examType: "T1",
        date: "",
        startTime: "",
        endTime: "",
        totalRooms: 2,
        invigilatorsPerRoom: 1,
        description: "",
      });
      setRooms(["N-401", "N-402"]);
      onClose();
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "Failed to create exam. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new examination.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input
                  id="courseCode"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("examType", value)}
                  defaultValue={formData.examType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T1">T1</SelectItem>
                    <SelectItem value="T4">T4</SelectItem>
                    <SelectItem value="Semester">Semester</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalRooms">Total Rooms</Label>
                <Input
                  id="totalRooms"
                  name="totalRooms"
                  type="number"
                  min={1}
                  value={formData.totalRooms}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invigilatorsPerRoom">Invigilators Per Room</Label>
                <Input
                  id="invigilatorsPerRoom"
                  name="invigilatorsPerRoom"
                  type="number"
                  min={1}
                  value={formData.invigilatorsPerRoom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rooms</Label>
              <div className="flex flex-wrap gap-2">
                {rooms.map((room) => (
                  <Badge 
                    key={room} 
                    variant="outline"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <span>{room}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(room)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Add room"
                    className="h-8 w-28"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddRoom}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Instructions</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
