import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = { threshold: 0.1, rootMargin: '0px' }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (elementRef.current) observer.unobserve(elementRef.current);
            }
        }, options);

        const element = elementRef.current;
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options]);

    return { elementRef, isVisible };
};
