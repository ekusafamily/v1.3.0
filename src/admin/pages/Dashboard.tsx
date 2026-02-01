
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Registration {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    id_number: string;
    county: string;
    created_at: string;
}

const Dashboard = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Registration; direction: 'asc' | 'desc' } | null>(null);

    // Export state
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportPassword, setExportPassword] = useState("");
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!exportPassword) return;
        setExporting(true);

        try {
            // Verify password
            const verifyRes = await fetch('/api/admin/verify-super-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: exportPassword }),
            });

            if (!verifyRes.ok) {
                toast.error("Incorrect password");
                setExporting(false);
                return;
            }

            // Generate CSV
            const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "County", "Date Registered"];
            const csvContent = [
                headers.join(","),
                ...registrations.map(u => [
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.county,
                    new Date(u.created_at).toLocaleDateString()
                ].map(field => `"${field}"`).join(","))
            ].join("\n");

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `members_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export successful");
            setIsExportDialogOpen(false);
            setExportPassword("");
        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const handleSort = (key: keyof Registration) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRegistrations = [...registrations].sort((a, b) => {
        if (!sortConfig) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    useEffect(() => {
        fetch('/api/registrations')
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("Data received:", data);
                setRegistrations(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch registrations:", err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Members</h2>
                    <p className="text-muted-foreground">Manage and view registered members.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm py-1 px-4">
                        Total Members: {registrations.length}
                    </Badge>
                    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Super Admin Verification</DialogTitle>
                                <DialogDescription>
                                    Please enter the super admin password to download the member list.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={exportPassword}
                                        onChange={(e) => setExportPassword(e.target.value)}
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleExport} disabled={exporting}>
                                    {exporting ? "Verifying..." : "Download"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-lg">
                            Error loading data: {error}
                            <br />
                            <span className="text-sm text-muted-foreground mt-2 block">Ensure the backend server is running on port 3000.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableCaption>A list of recent registrations.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => handleSort('county')}
                                        >
                                            County {sortConfig?.key === 'county' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead>Date Registered</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedRegistrations.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.id}</TableCell>
                                            <TableCell>{user.first_name} {user.last_name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>{user.county}</TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
