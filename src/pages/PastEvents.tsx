import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Loader2, X, Image as ImageIcon, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PastEvent {
    id: number;
    title: string;
    description: string;
    date: string;
    image_url: string;
    images?: string[];
    created_at: string;
}

const PastEvents = () => {
    const [events, setEvents] = useState<PastEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Lightbox/Article State
    const [articleOpen, setArticleOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<PastEvent | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch("/api/past-events");
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                }
            } catch (error) {
                console.error("Error fetching events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Lock body scroll when article is open
    useEffect(() => {
        if (articleOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [articleOpen]);

    const openArticle = (event: PastEvent) => {
        setCurrentEvent(event);
        setArticleOpen(true);
    };

    const closeArticle = () => {
        setArticleOpen(false);
        setCurrentEvent(null);
    };

    return (
        <>
            <Helmet>
                <title>The KBL Chronicle | Past Events</title>
                <meta name="description" content="A collection of moments and memories from our journey." />
            </Helmet>

            <div className="min-h-screen bg-[#f9f7f1] text-gray-900 font-serif flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="container mx-auto px-4 max-w-6xl">

                        {/* Newspaper Header - List View */}
                        <div className="border-b-4 border-black mb-12 pb-6 text-center">
                            <h1 className="text-5xl md:text-8xl font-black text-black mb-4 uppercase tracking-tighter" style={{ fontFamily: 'serif' }}>
                                The KBL Chronicle
                            </h1>
                            <div className="flex justify-between items-center border-t-2 border-black pt-3 text-sm md:text-base font-bold italic text-gray-600 uppercase tracking-widest">
                                <span>Vol. {new Date().getFullYear()}</span>
                                <span>Pictorial & Editorial</span>
                                <span>Est. 2024</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-16 w-16 animate-spin text-black" />
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-24 border-2 border-dashed border-gray-300">
                                <h3 className="text-2xl font-bold mb-2">No Stories Yet</h3>
                                <p className="text-gray-500 italic">Check back soon for updates.</p>
                            </div>
                        ) : (
                            /* Newspaper Masonry Layout (2 Columns) */
                            <div className="columns-1 md:columns-2 gap-12 space-y-12">
                                {events.map((event) => (
                                    <article
                                        key={event.id}
                                        className="break-inside-avoid bg-white p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 mb-12 cursor-pointer group"
                                        onClick={() => openArticle(event)}
                                    >
                                        {/* Image Section */}
                                        <div className="relative mb-6 overflow-hidden border border-gray-100">
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-auto object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                                                loading="lazy"
                                            />
                                            {event.images && event.images.length > 1 && (
                                                <div className="absolute bottom-0 right-0 bg-black text-white text-xs font-sans font-bold px-2 py-1 uppercase">
                                                    +{event.images.length - 1} Photos
                                                </div>
                                            )}
                                        </div>

                                        {/* Headline & Teaser */}
                                        <div className="flex items-center gap-2 text-xs font-sans font-bold text-gray-500 uppercase tracking-widest mb-3">
                                            <Calendar className="h-3 w-3" />
                                            {event.date ? format(new Date(event.date), "MMMM d, yyyy") : "Undated"}
                                        </div>

                                        <h2 className="text-3xl font-bold leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4">
                                            {event.title}
                                        </h2>

                                        <p className="font-serif text-gray-600 line-clamp-3 mb-4">
                                            {event.description}
                                        </p>

                                        <Button variant="link" className="p-0 h-auto font-sans font-bold uppercase text-xs tracking-widest">
                                            Read Full Story <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                <Footer />

                {/* Newspaper Article Modal (The "Schematic" View) */}
                {articleOpen && currentEvent && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                        {/* Paper Sheet */}
                        <div className="bg-[#fffdf9] w-full max-w-6xl h-full md:h-[95vh] shadow-2xl overflow-y-auto relative flex flex-col md:rounded-sm animate-in slide-in-from-bottom-4 duration-300">

                            {/* Close Button */}
                            <button
                                onClick={closeArticle}
                                className="fixed top-4 right-4 md:absolute md:top-4 md:right-4 bg-black text-white p-2 hover:bg-gray-800 transition-colors z-50 rounded-full shadow-lg"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            {/* Article Container */}
                            <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full flex-1">

                                {/* Article Header */}
                                <header className="border-b-4 border-black pb-8 mb-8">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-black pb-4 mb-4">
                                        <h1 className="text-4xl md:text-7xl font-black font-serif uppercase tracking-tight leading-none text-black">
                                            {currentEvent.title}
                                        </h1>
                                        <div className="text-right md:text-left mt-4 md:mt-0 min-w-fit">
                                            <div className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500">Edition</div>
                                            <div className="font-serif font-bold text-lg">{currentEvent.date ? format(new Date(currentEvent.date), "MMMM d, yyyy") : "Special Feature"}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                                        <span>KBL Exclusive</span>
                                        <span>Community Report</span>
                                        <span>Vol. {new Date().getFullYear()}</span>
                                    </div>
                                </header>

                                {/* Article Body Layout - Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                                    {/* Left Column: Main Text (Spans 4 cols) */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="prose prose-stone font-serif text-gray-800 text-justify leading-relaxed">
                                            <p className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-[-8px]">
                                                {currentEvent.description}
                                            </p>
                                            <p>
                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                            </p>
                                        </div>

                                        {/* "Advert" Box filler for vibe */}
                                        <div className="border-2 border-black p-4 mt-8 text-center bg-gray-100">
                                            <span className="block text-xs font-sans font-bold uppercase mb-2">Space Available</span>
                                            <div className="font-serif italic text-sm">Join the KBL Community today!</div>
                                        </div>
                                    </div>

                                    {/* Right Column: Pictures (Spans 8 cols) */}
                                    <div className="lg:col-span-8">
                                        {/* Main Feature Image */}
                                        <figure className="mb-8 border-b border-gray-200 pb-4">
                                            <img
                                                src={currentEvent.image_url}
                                                alt="Main Feature"
                                                className="w-full h-auto object-cover border border-gray-900 shadow-sm"
                                            />
                                            <figcaption className="mt-2 text-xs font-sans font-bold uppercase text-gray-500 flex justify-between">
                                                <span>Fig 1. Event Highlights</span>
                                                <span>Photo by KBL Media</span>
                                            </figcaption>
                                        </figure>

                                        {/* Grid of other images */}
                                        {currentEvent.images && currentEvent.images.length > 0 && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {currentEvent.images.filter(img => img !== currentEvent.image_url).map((img, idx) => (
                                                    <figure key={idx} className="break-inside-avoid mb-4">
                                                        <img
                                                            src={img}
                                                            alt={`Detail ${idx}`}
                                                            className="w-full h-auto object-cover border border-gray-200 grayscale-[10%] hover:grayscale-0 transition-all cursor-zoom-in"
                                                        />
                                                    </figure>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="mt-12 pt-8 border-t border-black text-center text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                                    *** End of Article ***
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default PastEvents;
