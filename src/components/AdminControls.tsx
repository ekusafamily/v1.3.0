import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Upload, Calendar } from "lucide-react";

export const AdminControls = ({ user }: { user: any }) => {
    const [activeTab, setActiveTab] = useState<"upload" | "search">("upload");

    // Upload State
    const [uploading, setUploading] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("user_id", user.id); // For auth check

        try {
            const response = await fetch("/api/admin/past-events", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                toast.success("Event uploaded successfully!");
                (e.target as HTMLFormElement).reset();
            } else {
                const error = await response.json();
                toast.error(error.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error", error);
            toast.error("Error uploading event");
        } finally {
            setUploading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setSearching(true);
        try {
            const response = await fetch("/api/admin/search-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery }),
            });
            const data = await response.json();
            if (response.ok) {
                setSearchResults(data);
                if (data.length === 0) toast.info("No users found");
            } else {
                toast.error("Search failed");
            }
        } catch (error) {
            console.error("Search error", error);
            toast.error("Error searching users");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="mt-12 p-6 border border-border rounded-2xl bg-card">
            <h3 className="text-2xl font-bold mb-6 font-heading text-red-500">Super Admin Panel</h3>

            <div className="flex gap-4 mb-6">
                <Button
                    variant={activeTab === "upload" ? "default" : "outline"}
                    onClick={() => setActiveTab("upload")}
                >
                    <Upload className="mr-2 h-4 w-4" /> Upload Event
                </Button>
                <Button
                    variant={activeTab === "search" ? "default" : "outline"}
                    onClick={() => setActiveTab("search")}
                >
                    <Search className="mr-2 h-4 w-4" /> Search User
                </Button>
            </div>

            {activeTab === "upload" && (
                <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
                    <div>
                        <Label htmlFor="image">Event Image</Label>
                        <Input id="image" name="image" type="file" accept="image/*" required />
                    </div>
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="Event Title" required />
                    </div>
                    <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="What happened?" required />
                    </div>
                    <Button type="submit" disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload Event"}
                    </Button>
                </form>
            )}

            {activeTab === "search" && (
                <div className="space-y-6">
                    <form onSubmit={handleSearch} className="flex gap-4 max-w-md">
                        <Input
                            placeholder="Search by Phone or hidden ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={searching}>
                            {searching ? "..." : "Search"}
                        </Button>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">County</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">ID (Hidden)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((u) => (
                                        <tr key={u.id} className="border-b border-border">
                                            <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                                            <td className="px-4 py-3">{u.email}</td>
                                            <td className="px-4 py-3">{u.phone}</td>
                                            <td className="px-4 py-3">{u.county}</td>
                                            <td className="px-4 py-3">{u.role || "Member"}</td>
                                            <td className="px-4 py-3 font-mono text-red-400">{u.id_number || "**HIDDEN**"} (Shown to Admin)</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
