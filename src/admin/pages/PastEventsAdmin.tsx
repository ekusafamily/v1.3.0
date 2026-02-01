import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Calendar, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const PastEventsAdmin = () => {
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const [superAdminPassword, setSuperAdminPassword] = useState("");

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!superAdminPassword) {
            toast.error("Please enter the Super Admin Password");
            return;
        }

        setUploading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("password", superAdminPassword);

        try {
            const response = await fetch("/api/admin/past-events", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                toast.success("Event uploaded successfully!");
                (e.target as HTMLFormElement).reset();
                setSuperAdminPassword(""); // Clear password for security
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

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Past Events Management</h2>
                <p className="text-muted-foreground">Upload and manage events displayed in the public gallery.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Upload New Event
                        </CardTitle>
                        <CardDescription>
                            Add a new event with up to 10 photos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                                <Label htmlFor="password" className="text-red-500 font-bold">Super Admin Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={superAdminPassword}
                                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                                    placeholder="Enter verification password"
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="images">Event Images (Max 10)</Label>
                                <Input
                                    id="images"
                                    name="images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Hold Ctrl/Cmd to select multiple photos.
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" placeholder="e.g., Annual Youth Summit 2025" required />
                            </div>
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Brief description of the event..."
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? "Uploading..." : "Publish Event"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-muted/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Preview & Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Uploaded events appear immediately on the public <a href="/#/past-events" target="_blank" className="font-medium text-primary hover:underline inline-flex items-center">Past Events page <ArrowUpRight className="h-3 w-3 ml-0.5" /></a>.
                        </p>
                        <p>
                            Make sure images are optimized and under 5MB. Supported formats: JPG, PNG, WEBP.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PastEventsAdmin;
