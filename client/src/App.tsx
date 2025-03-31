import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Exams from "@/pages/exams";
import Invigilation from "@/pages/invigilation";
import Faculty from "@/pages/faculty";
import Requests from "@/pages/requests";
import Reports from "@/pages/reports";
import FacultyDashboard from "@/pages/faculty-dashboard";
import FacultySchedule from "@/pages/faculty-schedule";
import FacultyDuties from "@/pages/faculty-duties";
import AuthPage from "@/pages/auth-page";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useUserStore } from "@/hooks/use-user-store";
import { useEffect } from "react";

function Router() {
  const { user, isLoading } = useAuth();
  const { isAdmin, setUser } = useUserStore();
  
  useEffect(() => {
    // Set the user in the user store when authenticated
    if (user) {
      setUser({
        id: user.id,
        name: user.name,
        username: user.username,
        isAdmin: user.isAdmin
      });
    }
  }, [user, setUser]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // If admin is true, show admin routes, otherwise show faculty routes
  return (
    <Switch>
      {/* Auth route - accessible without login */}
      <Route path="/auth" component={AuthPage} />
      
      {isAdmin ? (
        // Admin Routes - all protected
        <>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/exams" component={Exams} />
          <ProtectedRoute path="/invigilation" component={Invigilation} />
          <ProtectedRoute path="/faculty" component={Faculty} />
          <ProtectedRoute path="/requests" component={Requests} />
          <ProtectedRoute path="/reports" component={Reports} />
        </>
      ) : (
        // Faculty Routes - all protected
        <>
          <ProtectedRoute path="/" component={FacultyDashboard} />
          <ProtectedRoute path="/dashboard" component={FacultyDashboard} />
          <ProtectedRoute path="/schedule" component={FacultySchedule} />
          <ProtectedRoute path="/duties" component={FacultyDuties} />
        </>
      )}
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
