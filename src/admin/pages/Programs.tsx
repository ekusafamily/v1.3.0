
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Program {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    created_at: string;
}

interface InterestedMember {
    user_email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
}

const Programs = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [interestedMembers, setInterestedMembers] = useState<InterestedMember[]>([]);
    const [viewingInterestTitle, setViewingInterestTitle] = useState("");
    const [isInterestDialogOpen, setIsInterestDialogOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");

    const fetchPrograms = () => {
        setLoading(true);
        fetch('/api/programs')
            .then(res => res.json())
            .then(data => {
                setPrograms(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch programs:", err);
                toast.error("Failed to load programs");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const programData = { title, description, date, location };
        const url = editingProgram ? `/api/programs/${editingProgram.id}` : '/api/programs';
        const method = editingProgram ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programData),
            });

            if (response.ok) {
                toast.success(editingProgram ? "Program updated" : "Program created");
                setIsDialogOpen(false);
                resetForm();
                fetchPrograms();
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this program?")) return;

        try {
            const response = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success("Program deleted");
                fetchPrograms();
            } else {
                toast.error("Failed to delete program");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleViewInterest = async (program: Program) => {
        setViewingInterestTitle(program.title);
        try {
            const response = await fetch(`/api/programs/${program.id}/interested`);
            const data = await response.json();
            setInterestedMembers(data);
            setIsInterestDialogOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load interested members");
        }
    };

    const openEditDialog = (program: Program) => {
        setEditingProgram(program);
        setTitle(program.title);
        setDescription(program.description);
        setDate(program.date);
        setLocation(program.location);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingProgram(null);
        setTitle("");
        setDescription("");
        setDate("");
        setLocation("");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Programs & Events</h2>
                    <p className="text-muted-foreground">Manage events and view interested members.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Program
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
                            <DialogDescription>
                                Create a new event or program.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingProgram ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Programs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programs.map((program) => (
                                    <TableRow key={program.id}>
                                        <TableCell className="font-medium">{program.title}</TableCell>
                                        <TableCell>{program.date}</TableCell>
                                        <TableCell>{program.location}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleViewInterest(program)}>
                                                <Users className="h-4 w-4 mr-1" /> Interest
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(program)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(program.id)}>
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

            {/* Interest Dialog */}
            <Dialog open={isInterestDialogOpen} onOpenChange={setIsInterestDialogOpen}>
                <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Interested Members: {viewingInterestTitle}</DialogTitle>
                        <DialogDescription>List of members who tapped "I'm Interested".</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interestedMembers.length > 0 ? (
                                    interestedMembers.map((member, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{member.first_name || "N/A"}</TableCell>
                                            <TableCell>{member.last_name || "N/A"}</TableCell>
                                            <TableCell>{member.user_email}</TableCell>
                                            <TableCell>{member.phone_number || "N/A"}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No interested members yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Programs;
