import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, CheckCircle, Hand, Loader2, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Program {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  created_at: string;
}

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registeredPrograms, setRegisteredPrograms] = useState<Set<number>>(new Set());
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    let userEmail = "";
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      userEmail = parsedUser.email;
    }

    // Fetch programs
    fetch('/api/programs')
      .then(res => res.json())
      .then(data => {
        setPrograms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch user's interests if logged in
    if (userEmail) {
      fetch(`/api/my-interests?email=${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(data => {
          setRegisteredPrograms(new Set(data));
        })
        .catch(console.error);
    }
  }, []);

  const handleInterest = async (programId: number) => {
    if (!user) {
      toast.error("Please login to register your interest.");
      return;
    }

    try {
      const response = await fetch(`/api/programs/${programId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisteredPrograms(prev => new Set(prev).add(programId));
        setShowSuccessDialog(true);
      } else {
        toast.error(data.error || "Failed to register interest");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 backdrop-blur-[2px]" />
          </div>

          <div className="relative container mx-auto px-4 text-center z-10">
            <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium tracking-wide bg-primary/20 text-primary-foreground border-primary/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="h-3 w-3 mr-2 inline-block" />
              Community Initiatives
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
              Programs that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Inspire</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
              Join us in making a difference. Explore our upcoming workshops, mentorship sessions, and community outreach events.
            </p>
          </div>
        </section>

        {/* Programs Grid Section */}
        <section className="container mx-auto px-4 py-20 -mt-20 relative z-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl shadow-sm border border-border/50">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading programs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.length > 0 ? (
                programs.map((program, index) => (
                  <Card
                    key={program.id}
                    className="group flex flex-col h-full border-border/50 bg-card/95 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="relative pb-0">
                      <div className="absolute top-0 right-0 p-4">
                        <Badge variant={registeredPrograms.has(program.id) ? "default" : "secondary"} className="text-xs font-bold uppercase tracking-wider shadow-sm">
                          {registeredPrograms.has(program.id) ? "Registered" : "Open"}
                        </Badge>
                      </div>
                      <div className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full w-fit mb-4 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(program.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <CardTitle className="font-heading text-2xl group-hover:text-primary transition-colors">{program.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-3 pb-4 border-b border-border/50">
                        <MapPin className="h-4 w-4 text-primary/70" />
                        <span>{program.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {program.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-6 pb-8 px-6 bg-muted/30 mt-auto">
                      {user ? (
                        <Button
                          className={`w-full h-11 text-base font-medium shadow-md transition-all duration-300 ${registeredPrograms.has(program.id)
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none cursor-default"
                              : "hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                          onClick={() => handleInterest(program.id)}
                          disabled={registeredPrograms.has(program.id)}
                        >
                          {registeredPrograms.has(program.id) ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Registered Successfully
                            </>
                          ) : (
                            <>
                              <Hand className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                              I'm Interested
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="w-full text-center">
                          <Link to="/membership">
                            <Button variant="outline" className="w-full h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                              Login to Register
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-3xl border border-dashed border-border">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Programs Scheduled</h3>
                  <p className="text-muted-foreground max-w-sm">
                    We're currently planning our next big events. Check back soon for updates!
                  </p>
                </div>
              )}
            </div>
          )}

          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-md text-center py-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-3xl font-heading text-center mb-2">You're on the list!</DialogTitle>
                <DialogDescription className="text-center text-lg text-muted-foreground">
                  Thanks for showing interest. We'll be in touch with more details shortly.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center mt-8">
                <Button onClick={() => setShowSuccessDialog(false)} size="lg" className="w-full sm:w-auto min-w-[150px]">
                  Awesome!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Programs;