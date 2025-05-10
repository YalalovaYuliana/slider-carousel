import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import './Slider.css'
import type Beer from './Beer';

type sliderProps = {
    sizeSlides: {
        width: number
        height: number
    },
    spacebetweenSlides: number,
    sizeContainer: number,
    beers: Beer[]
}

type PositionData = {
    x?: number;
    scale?: number;
    leftPos?: number;
    zIndex?: number;
};

type XScaleRef = {
    [key: number]: HTMLImageElement | null;
};

type beerData = {
    alt: string;
    src: string;
}

type textData = {
    name: string;
    description: string;
}

const Slider: React.FC<sliderProps> = ({ sizeSlides, spacebetweenSlides, sizeContainer, beers }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
    const xScale = useRef<XScaleRef>({});
    const indexesArray = useRef<Set<number>>(new Set());
    const beersCopy = useRef<Beer[]>(beers.length % 2 === 0 ? [...beers.slice(0, -1)] : beers);
    const extraItemRef = useRef<beerData>({
        alt: beers[beers.length - 1].name,
        src: `data:image/png;base64,${beers[beers.length - 1].image}`
    });
    const [centerText, setCenterText] = React.useState<textData>({
        name: beersCopy.current[(beersCopy.current.length - 1) / 2].name,
        description: beersCopy.current[(beersCopy.current.length - 1) / 2].description
    });

    const slides = useMemo(() => beersCopy.current.map((beer, index) => (
        <img className="slide"
            style={{
                width: `${sizeSlides.width}px`,
                height: `${sizeSlides.height}px`
            }}
            key={index}
            src={`data:image/png;base64,${beer.image}`}
            ref={ref => {
                slideRefs.current[index] = ref;
            }}
            alt={beer.name} />
    )), [sizeSlides.width, sizeSlides.height, beersCopy]);

    const texts: textData[] = useMemo(() => beers.map((beer) => (
        {
            name: beer.name,
            description: beer.description
        }
    )), [beers]);

    function startDrag(
        startEvent: MouseEvent | TouchEvent,
        callback: (data: { x: number } | null) => void
    ): (moveEvent: MouseEvent | TouchEvent | null) => void {
        const isTouch = "touches" in startEvent;
        const startX = isTouch ? (startEvent as TouchEvent).touches[0].clientX : (startEvent as MouseEvent).clientX;

        return (moveEvent: MouseEvent | TouchEvent | null) => {
            if (moveEvent === null) return callback(null);
            const moveX = ("touches" in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX) - startX;
            callback({ x: moveX });
        };
    }

    const initDrag = useCallback((callback: (data: { x: number } | null) => void) => {
        let handler: (moveEvent: MouseEvent | TouchEvent | null) => void;

        return (startEvent: MouseEvent | TouchEvent) => {
            startEvent.preventDefault?.();

            handler = startDrag(startEvent, callback);

            const moveEvent = "touches" in startEvent ? "touchmove" : "mousemove";
            const endEvent = "touches" in startEvent ? "touchend" : "mouseup";

            window.addEventListener(moveEvent, handler as EventListener);
            window.addEventListener(endEvent, clearDraggingEvent);

            function clearDraggingEvent() {
                window.removeEventListener(moveEvent, handler as EventListener);
                window.removeEventListener(endEvent, clearDraggingEvent);
                handler(null);
            }
        };
    }, []);

    const getDistance = useCallback((callback: (data: { x: number } | null) => void) => {
        if (!containerRef.current) return;
        const event = initDrag(callback);
        containerRef.current.addEventListener("mousedown", event as EventListener);
        containerRef.current.addEventListener("touchstart", event as EventListener, { passive: false });
    }, [initDrag]);

    const calcPos = useCallback((x: number, slideWidth: number) => {
        if (!containerRef.current) return 0;
        const center = containerRef.current.offsetWidth / 2;
        return center + x * spacebetweenSlides - slideWidth / 2;
    }, [spacebetweenSlides]);

    const updateslides = useCallback((slide: HTMLImageElement, data: PositionData) => {
        if (data.x != null) {
            if (beers.length % 2 === 0 && slide.hasAttribute("data-x")) {
                const currentX = +(slide.getAttribute("data-x")!);
                if (data.x === Math.max(...indexesArray.current) && currentX === Math.min(...indexesArray.current)) {
                    const newExtraItem: beerData = {
                        alt: slide.getAttribute("alt")!,
                        src: slide.getAttribute("src")!
                    };
                    slide.setAttribute("alt", extraItemRef.current.alt);
                    slide.setAttribute("src", extraItemRef.current.src);
                    extraItemRef.current = newExtraItem;
                }

                if (data.x === Math.min(...indexesArray.current) && currentX === Math.max(...indexesArray.current)) {
                    const newExtraItem: beerData = {
                        alt: slide.getAttribute("alt")!,
                        src: slide.getAttribute("src")!
                    };
                    slide.setAttribute("alt", extraItemRef.current.alt);
                    slide.setAttribute("src", extraItemRef.current.src);
                    extraItemRef.current = newExtraItem;
                }
            }
            slide.setAttribute("data-x", data.x.toString());
        }
        if (data.scale != null) {
            slide.style.transform = `scale(${data.scale})`;
            slide.style.opacity = data.scale === 0 ? "0" : "1";
        }
        if (data.leftPos != null) {
            slide.style.left = `${data.leftPos}px`;
        }
        if (data.zIndex != null) {
            slide.style.zIndex = data.zIndex.toString();
        }
    }, [beers.length]);

    const calcScale = useCallback((x: number) => {
        const formula = 1 - (1 / 5) * Math.pow(x, 2);
        return formula <= 0 ? 0 : formula;
    }, []);

    const checkOrdering = useCallback((slide: HTMLImageElement, currentX: number, xDist: number, centerIndex: number) => {
        const original = parseInt(slide.dataset.x || "0");
        const rounded = Math.abs(xDist) >= 0.3 ? Math.sign(xDist) : 0;
        let newX = currentX;
        const totalX = currentX + rounded;

        if (currentX !== currentX + rounded) {
            if (totalX > original && totalX > centerIndex) {
                newX = ((totalX - 1) - centerIndex) - rounded + -centerIndex;
            } else if (totalX < original && totalX < -centerIndex) {
                newX = ((totalX + 1) + centerIndex) - rounded + centerIndex;
            }
            xScale.current[newX + rounded] = slide;
        }

        const temp = -Math.abs(newX + rounded);
        updateslides(slide, { zIndex: temp });

        return newX;
    }, [updateslides]);

    const build = useCallback(() => {
        if (!slideRefs.current[0] || !containerRef.current) return;

        const centerIndex = (slideRefs.current.length - 1) / 2;
        const slideWidth = sizeSlides.width;

        for (let i = 0; i < slideRefs.current.length; i++) {
            const slide = slideRefs.current[i];
            if (!slide) continue;

            const x = i - centerIndex;
            indexesArray.current.add(x);

            const scale = calcScale(x);
            const zIndex = -(Math.abs(i - centerIndex));
            const leftPos = calcPos(x, slideWidth);

            xScale.current[x] = slide;

            updateslides(slide, {
                x,
                scale,
                leftPos,
                zIndex,
            });
        }
    }, [calcScale, calcPos, updateslides, sizeSlides.width]);

    const moveSlides = useCallback((data: { x: number } | null) => {
        if (!slideRefs.current[0] || !containerRef.current) return;

        const centerIndex = (slideRefs.current.length - 1) / 2;
        let xDist: number;

        if (data != null) {
            containerRef.current.classList.remove("smooth-return");
            xDist = data.x / 250;
        } else {
            containerRef.current.classList.add("smooth-return");
            xDist = 0;

            for (const x in xScale.current) {
                const slide = xScale.current[x];
                if (slide) {
                    updateslides(slide, {
                        x: parseInt(x),
                        zIndex: Math.abs(Math.abs(parseInt(x)) - centerIndex),
                    });
                }
            }
        }

        const slideWidth = sizeSlides.width;

        for (let i = 0; i < slideRefs.current.length; i++) {
            const slide = slideRefs.current[i];
            if (!slide) continue;

            const currentX = parseInt(slide.dataset.x || "0");
            const x = checkOrdering(slide, currentX, xDist, centerIndex);
            const scale = calcScale(x + xDist);
            const leftPos = calcPos(x + xDist, slideWidth);

            updateslides(slide, {
                scale,
                leftPos,
            });
        }

        const centerSlide = xScale.current[0]; // x === 0 - центральный слайд
        if (centerSlide) {
            const text = texts.find(text => text.name === centerSlide.alt);
            if (text) setCenterText(text);
        }
    }, [calcScale, calcPos, checkOrdering, updateslides, sizeSlides.width]);

    useEffect(() => {
        build();
        getDistance(moveSlides);

        const currentContainer = containerRef.current;

        return () => {
            if (currentContainer) {
                const event = initDrag(moveSlides);
                currentContainer.removeEventListener("mousedown", event as EventListener);
                currentContainer.removeEventListener("touchstart", event as EventListener);
            }
        };
    }, [build, getDistance, initDrag, moveSlides]);

    return (
        <div className='main-container'>
            <div
                ref={containerRef}
                className="container"
                style={{
                    width: `${sizeContainer}px`,
                    height: `${sizeSlides.height}px`,
                }}
            >
                {slides}
            </div>
            <div className="text" key={centerText.name}>
                <h3 className="beer-name">{centerText.name}</h3>
                <p className="beer-description">{centerText.description}</p>
            </div>
        </div>
    );
};

export default Slider;
