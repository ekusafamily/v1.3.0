
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Communities from "./pages/Communities";
import Blog from "./pages/Blog";
import Programs from "./pages/Programs";
import PastEventsAdmin from "./pages/PastEventsAdmin";
import CountyStats from "./pages/CountyStats";
import AdminLayout from "./components/AdminLayout";
import PlaceholderPage from "./components/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<AdminLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/communities" element={<Communities />} />
                        <Route path="/shop" element={<PlaceholderPage title="Shop Management" />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/programs" element={<Programs />} />
                        <Route path="/events" element={<PastEventsAdmin />} />
                        <Route path="/stats" element={<CountyStats />} />
                    </Route>
                </Routes>
            </Router>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
