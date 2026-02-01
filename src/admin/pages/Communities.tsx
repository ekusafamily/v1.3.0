
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Community {
    id: number;
    county: string;
    members_count: string;
    leader_name: string;
    whatsapp_link?: string;
}

const Communities = () => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

    // Form state
    const [county, setCounty] = useState("");
    const [membersCount, setMembersCount] = useState("");
    const [leaderName, setLeaderName] = useState("");
    const [whatsappLink, setWhatsappLink] = useState("");

    const fetchCommunities = () => {
        setLoading(true);
        fetch('/api/communities')
            .then(res => res.json())
            .then(data => {
                setCommunities(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch communities:", err);
                toast.error("Failed to load communities");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const communityData = {
            county,
            members_count: membersCount,
            leader_name: leaderName,
            whatsapp_link: whatsappLink
        };
        const url = editingCommunity ? `/api/communities/${editingCommunity.id}` : '/api/communities';
        const method = editingCommunity ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(communityData),
            });

            if (response.ok) {
                toast.success(editingCommunity ? "Community updated" : "Community added");
                setIsDialogOpen(false);
                resetForm();
                fetchCommunities();
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this community?")) return;

        try {
            const response = await fetch(`/api/communities/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success("Community deleted");
                fetchCommunities();
            } else {
                toast.error("Failed to delete community");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const openEditDialog = (community: Community) => {
        setEditingCommunity(community);
        setCounty(community.county);
        setMembersCount(community.members_count);
        setLeaderName(community.leader_name);
        setWhatsappLink(community.whatsapp_link || "");
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingCommunity(null);
        setCounty("");
        setMembersCount("");
        setLeaderName("");
        setWhatsappLink("");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Communities</h2>
                    <p className="text-muted-foreground">Manage active county communities.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Community
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCommunity ? "Edit Community" : "Add Community"}</DialogTitle>
                            <DialogDescription>
                                Enter details for the county community.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="county">County Name</Label>
                                <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="members">Members Count (e.g. "500+")</Label>
                                <Input id="members" value={membersCount} onChange={(e) => setMembersCount(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="leader">Leader Name</Label>
                                <Input id="leader" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp">WhatsApp Group Link (Optional)</Label>
                                <Input id="whatsapp" value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingCommunity ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Communities</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>County</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Leader</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {communities.map((community) => (
                                    <TableRow key={community.id}>
                                        <TableCell className="font-medium">{community.county}</TableCell>
                                        <TableCell>{community.members_count}</TableCell>
                                        <TableCell>{community.leader_name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(community)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(community.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Communities;
