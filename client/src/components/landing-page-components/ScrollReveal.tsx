import React, { useEffect, useRef, useState } from 'react';

type AnimationType = 'fade-in-up' | 'fade-in' | 'scale-in' | 'slide-in-right' | 'slide-in-left';

interface ScrollRevealProps {
    children: React.ReactNode;
    animation?: AnimationType;
    delay?: number;
    className?: string;
    threshold?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    animation = 'fade-in-up',
    delay = 0,
    className = '',
    threshold = 0.1
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: threshold,
                rootMargin: '50px' // Start animation slightly before the element enters
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-in-up': return 'animate-fade-in-up';
            case 'fade-in': return 'animate-fade-in';
            case 'scale-in': return 'animate-scale-in';
            case 'slide-in-right': return 'animate-slide-in-right';
            case 'slide-in-left': return 'animate-slide-in-left';
            default: return 'animate-fade-in-up';
        }
    };

    return (
        <div
            ref={ref}
            className={`opacity-0 ${isVisible ? getAnimationClass() : ''} ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

export default ScrollReveal;
