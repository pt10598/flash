import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import ServicePage from "./pages/Service";

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
      <Route path="/service" component={ServicePage} />

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

function LineFloatButton() {
  const [location] = useLocation();
  // 在 /service 頁面本身不顯示懸浮按鈕，避免重複
  if (location === "/service") return null;
  return (
    <a
      href="/service"
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#06C755] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
      style={{ boxShadow: "0 4px 16px rgba(6,199,85,0.45)" }}
      title="聯繫 LINE 客服"
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    </a>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
          <LineFloatButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
