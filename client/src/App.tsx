import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";

// Member dashboard pages
import DashboardHome from "./pages/Dashboard";
import ProfilePage from "./pages/Profile";
import DocumentsPage from "./pages/Documents";
import ApplyPage from "./pages/Apply";
import LoansPage from "./pages/Loans";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoans, { AdminLoanDetail } from "./pages/admin/AdminLoans";
import AdminRepayments from "./pages/admin/AdminRepayments";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAdmins from "./pages/admin/AdminAdmins";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />

      {/* Member Dashboard */}
      <Route path="/dashboard" component={DashboardHome} />
      <Route path="/dashboard/profile" component={ProfilePage} />
      <Route path="/dashboard/documents" component={DocumentsPage} />
      <Route path="/dashboard/apply" component={ApplyPage} />
      <Route path="/dashboard/loans" component={LoansPage} />

      {/* Redirect /apply and /invest to dashboard */}
      <Route path="/apply">
        {() => { window.location.href = "/dashboard/apply"; return null; }}
      </Route>
      <Route path="/invest">
        {() => { window.location.href = "/dashboard/apply"; return null; }}
      </Route>

      {/* Admin */}
      <Route path="/adminmanagebackstage/login" component={AdminLogin} />
      <Route path="/adminmanagebackstage" component={AdminDashboard} />
      <Route path="/adminmanagebackstage/users" component={AdminUsers} />
      <Route path="/adminmanagebackstage/loans" component={AdminLoans} />
      <Route path="/adminmanagebackstage/loans/:id" component={AdminLoanDetail} />
      <Route path="/adminmanagebackstage/admins" component={AdminAdmins} />
      <Route path="/adminmanagebackstage/repayments" component={AdminRepayments} />

      {/* Login fallback (when OAuth not configured) */}
      <Route path="/login" component={Login} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
