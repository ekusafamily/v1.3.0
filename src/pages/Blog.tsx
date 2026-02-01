import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";


import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  created_at: string;
}

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetch('/api/blogs')
      .then(res => res.json())
      .then(data => {
        setBlogPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch blog posts:", err);
        setLoading(false);
      });
  }, []);
  return (
    <>
      <Helmet>
        <title>Blog | Kabila La Vijana</title>
        <meta name="description" content="Stay updated with the latest news, announcements, and stories from Kabila La Vijana." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero */}
          <section className="py-20 md:py-28 hero-gradient relative overflow-hidden">
            <div className="wave-decoration opacity-50" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Latest News & Updates
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl">
                  Stay informed about our activities and announcements
                </p>
              </div>
            </div>
          </section>

          {/* Blog Grid */}
          <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">Loading news...</p>
                  </div>
                ) : (
                  blogPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group card-gradient rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <img src={logo} alt="" className="h-10 w-10 rounded-full bg-muted p-1" />
                          <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-foreground text-xl mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all p-0 hover:bg-transparent"
                            onClick={() => setSelectedPost(post)}
                          >
                            Read More <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Blog Details Dialog */}
          <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    {selectedPost?.category}
                  </span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedPost?.created_at && new Date(selectedPost.created_at).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-bold font-heading">{selectedPost?.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4 mt-4">
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                  {selectedPost?.content || selectedPost?.excerpt}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;