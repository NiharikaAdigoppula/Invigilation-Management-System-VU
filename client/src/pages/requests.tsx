import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate, getStatusBadgeClass, formatStatus } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Request {
  id: number;
  requestType: string;
  examId: number;
  facultyId: number;
  facultyName?: string;
  reason: string;
  status: string;
  createdAt: string;
  faculty?: {
    id: number;
    name: string;
  };
  exam?: {
    id: number;
    name: string;
    date: string;
  };
}

export default function Requests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRequest, setViewRequest] = useState<Request | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch requests
  const { data: requests = [], isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (request.facultyName && request.facultyName.toLowerCase().includes(searchTermLower)) ||
      (request.faculty?.name && request.faculty.name.toLowerCase().includes(searchTermLower)) ||
      (request.exam?.name && request.exam.name.toLowerCase().includes(searchTermLower)) ||
      request.requestType.toLowerCase().includes(searchTermLower)
    );
  });

  // Handle request approval or rejection
  const handleUpdateRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      await apiRequest("PUT", `/api/requests/${requestId}`, { status });
      
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
      
      setViewRequest(null);
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
                Faculty Requests
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
        
        {/* Requests content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Manage Requests</h2>
            <div className="flex space-x-2 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search requests..."
                  className="w-full sm:w-[250px] pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Requests table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-neutral-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Request Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-800">
                            {formatStatus(request.requestType)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                          {request.facultyName || request.faculty?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-800">{request.exam?.name || '-'}</div>
                          <div className="text-xs text-neutral-500">
                            {request.exam?.date ? formatDate(request.exam.date) : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadgeClass(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setViewRequest(request)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleUpdateRequestStatus(request.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
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

      {/* View Request Dialog */}
      {viewRequest && (
        <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Review faculty request information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 items-center">
                <div className="text-sm font-medium">Request Type:</div>
                <div className="col-span-2 text-sm">{formatStatus(viewRequest.requestType)}</div>
              </div>
              
              <div className="grid grid-cols-3 items-center">
                <div className="text-sm font-medium">Faculty:</div>
                <div className="col-span-2 text-sm">{viewRequest.facultyName || viewRequest.faculty?.name || '-'}</div>
              </div>
              
              <div className="grid grid-cols-3 items-center">
                <div className="text-sm font-medium">Exam:</div>
                <div className="col-span-2 text-sm">{viewRequest.exam?.name}</div>
              </div>
              
              <div className="grid grid-cols-3 items-center">
                <div className="text-sm font-medium">Date:</div>
                <div className="col-span-2 text-sm">
                  {viewRequest.exam?.date ? formatDate(viewRequest.exam.date) : '-'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 items-start">
                <div className="text-sm font-medium">Reason:</div>
                <div className="col-span-2 text-sm whitespace-pre-wrap bg-neutral-50 p-3 rounded-md border">
                  {viewRequest.reason}
                </div>
              </div>
              
              <div className="grid grid-cols-3 items-center">
                <div className="text-sm font-medium">Status:</div>
                <div className="col-span-2">
                  <Badge className={getStatusBadgeClass(viewRequest.status)}>
                    {formatStatus(viewRequest.status)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              {viewRequest.status === 'pending' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setViewRequest(null)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={() => handleUpdateRequestStatus(viewRequest.id, 'rejected')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Processing...' : 'Reject'}
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateRequestStatus(viewRequest.id, 'approved')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Processing...' : 'Approve'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setViewRequest(null)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
