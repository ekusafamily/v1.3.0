
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
import { Plus, Pencil, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    created_at: string;
}

const Blog = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Official");

    const fetchPosts = () => {
        setLoading(true);
        fetch('/api/blogs')
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch blog posts:", err);
                toast.error("Failed to load blog posts");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const postData = { title, excerpt, content, category };
        const url = editingPost ? `/api/blogs/${editingPost.id}` : '/api/blogs';
        const method = editingPost ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                toast.success(editingPost ? "Post updated" : "Post created");
                setIsDialogOpen(false);
                resetForm();
                fetchPosts();
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const response = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success("Post deleted");
                fetchPosts();
            } else {
                toast.error("Failed to delete post");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const openEditDialog = (post: BlogPost) => {
        setEditingPost(post);
        setTitle(post.title);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCategory(post.category);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingPost(null);
        setTitle("");
        setExcerpt("");
        setContent("");
        setCategory("Official");
    };

    const handleGenerateExcerpt = async () => {
        if (!content) {
            toast.error("Please enter some content first.");
            return;
        }

        const toastId = toast.loading("Generating excerpt...");

        try {
            const response = await fetch('/api/generate-excerpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            const data = await response.json();

            if (response.ok) {
                setExcerpt(data.excerpt);
                toast.success("Excerpt generated!", { id: toastId });
            } else {
                toast.error("Failed to generate excerpt", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred", { id: toastId });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Blog & News</h2>
                    <p className="text-muted-foreground">Manage news articles and announcements.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingPost ? "Edit Post" : "Add New Post"}</DialogTitle>
                            <DialogDescription>
                                Create a new announcement or news article.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Official, Event, Programs" required />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="excerpt">Excerpt (Short Summary)</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={handleGenerateExcerpt}
                                    >
                                        <Wand2 className="h-3 w-3" /> Auto-Generate
                                    </Button>
                                </div>
                                <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required rows={2} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Full Content</Label>
                                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={6} />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingPost ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell>{post.category}</TableCell>
                                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(post.id)}>
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

export default Blog;
