
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Users, ShoppingBag, BookOpen, Calendar, LogOut, Menu, X, MapPin, BarChart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("adminUser");
        if (!storedUser) {
            navigate("/login");
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("adminUser");
        navigate("/login");
    };

    // Search Logic
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);

        try {
            const searchRes = await fetch("/api/admin/search-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery }),
            });

            const data = await searchRes.json();
            if (searchRes.ok) {
                setSearchResults(data);
                setIsResultsOpen(true);
                if (data.length === 0) toast.info("No users found");
            } else {
                toast.error("Search failed");
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setSearching(false);
        }
    };

    const navItems = [
        { label: "Members", path: "/", icon: Users },
        { label: "Communities", path: "/communities", icon: MapPin },
        { label: "Shop", path: "/shop", icon: ShoppingBag },
        { label: "Blog", path: "/blog", icon: BookOpen },
        { label: "Programs", path: "/programs", icon: Calendar },
        { label: "Past Events", path: "/events", icon: Calendar },
        { label: "County Stats", path: "/stats", icon: BarChart },
    ];

    if (!user) return null;

    return (
        <>
            <div className="min-h-screen bg-background flex">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                        !sidebarOpen && "-translate-x-full"
                    )}
                >
                    <div className="h-16 flex items-center px-6 border-b">
                        <span className="font-bold text-xl">Admin Panel</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search User..."
                                    className="pl-8 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="p-4 bg-gray-50 rounded-lg mb-4">
                            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </div>
                </aside>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen">
                    <header className="h-16 bg-white border-b flex items-center px-4 lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </header>
                    <main className="flex-1 overflow-auto p-4 md:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Results Dialog */}
            <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Search Results: "{searchQuery}"</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto">
                        {searchResults.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Phone</th>
                                        <th className="px-4 py-2">County</th>
                                        <th className="px-4 py-2">ID (Hidden)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((u) => (
                                        <tr key={u.id} className="border-b">
                                            <td className="px-4 py-2">{u.first_name} {u.last_name}</td>
                                            <td className="px-4 py-2">{u.phone}</td>
                                            <td className="px-4 py-2">{u.county}</td>
                                            <td className="px-4 py-2 font-mono text-red-500">{u.id_number}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-8 text-muted-foreground">No users found matching your query.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminLayout;
