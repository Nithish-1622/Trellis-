import React from 'react';
import ScrollReveal from './ScrollReveal';

interface TestimonialsProps {
    darkMode: boolean;
}

const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Software Engineer",
        company: "Tech Corp",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        quote: "Educat-AI transformed my career path. The personalized course recommendations were spot on and helped me land my dream job."
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Data Scientist",
        company: "DataViz",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        quote: "The adaptive learning path is incredible. It felt like having a personal mentor guiding me through every step of my data science journey."
    },
    {
        id: 3,
        name: "Emily Davis",
        role: "Product Manager",
        company: "Innovate Inc",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        quote: "I was overwhelmed by the amount of resources out there. Educat-AI curates exactly what I need to learn next, saving me so much time."
    }
];

const Testimonials: React.FC<TestimonialsProps> = ({ darkMode }) => {
    return (
        <section id="testimonials" className={`py-12 md:py-24 relative overflow-hidden ${darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50/50'}`}>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <ScrollReveal animation="fade-in-up">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                            Success Stories
                        </h2>
                        <p className={`text-lg md:text-xl max-w-2xl mx-auto ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            Join thousands of learners who have accelerated their careers with Educat-AI.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, i) => (
                        <ScrollReveal key={testimonial.id} animation="fade-in-up" delay={i * 150}>
                            <div
                                className={`p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl h-full ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/20"
                                    />
                                    <div>
                                        <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                                            {testimonial.name}
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                            {testimonial.role} at {testimonial.company}
                                        </p>
                                    </div>
                                </div>
                                <p className={`italic leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                    "{testimonial.quote}"
                                </p>
                                <div className="mt-6 flex gap-1 text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
