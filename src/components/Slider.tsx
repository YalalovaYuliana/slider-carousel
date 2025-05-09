import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import './Slider.css'
import type Beer from "./Beer";

type sliderProps = {
    sizeSlides: {
        width: number
        height: number
    },
    spacebetweenSlides: number,
    sizeContainer: number,
    beers: Beer[],
}

type PositionData = {
    slideIndex?: number;
    scale?: number;
    leftPos?: number;
    zIndex?: number;
};

type XScaleRef = {
    [key: number]: HTMLImageElement | null;
};

const Slider: React.FC<sliderProps> = ({ sizeSlides, spacebetweenSlides, sizeContainer, beers }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
    const xScale = useRef<XScaleRef>({});
    const indexArray = useRef<Set<number>>(new Set())
    //const [centerSlideIndex, setCenterSlideIndex] = useState<number | null>(null);
    //const [beersCopy, setBeersCopy] = useState<Beer[]>(beers.length % 2 === 0 ? [...beers.slice(0, beers.length - 1)] : beers)

    const [beersCopy, setBeersCopy] = useState<Beer[]>(beers)

    const slides = useMemo(() => {
        const items = beersCopy.map((beer, index) => (
            <img
                className="slide"
                style={{
                    width: `${sizeSlides.width}px`,
                    height: `${sizeSlides.height}px`
                }}
                key={index}
                src={`data:image/png;base64,${beer.image}`}
                ref={ref => {
                    if (slideRefs.current) {
                        slideRefs.current[index] = ref;
                    }
                }}
                alt={beer.name} />
        ));

        return items;
    }, [sizeSlides.width, sizeSlides.height, beersCopy]);

    const texts = useMemo(() => beers.map((beer, index) => (
        <div className="slide-text" key={index}>
            <h3 className="beer-name">{beer.name}</h3>
            <p className="beer-description">{beer.description}</p>
        </div>
    )), [beers]);

    // const updateCenterSlide = useCallback(() => {
    //     if (!containerRef.current || slideRefs.current.length === 0) return;

    //     const containerRect = containerRef.current.getBoundingClientRect();
    //     const containerCenter = containerRect.left + containerRect.width / 2;

    //     let closestIndex = 0;
    //     let closestDistance = Infinity;

    //     slideRefs.current.forEach((slide, index) => {
    //         if (!slide) return;
    //         const slideRect = slide.getBoundingClientRect();
    //         const slideCenter = slideRect.left + slideRect.width / 2;
    //         const distance = Math.abs(containerCenter - slideCenter);

    //         if (distance < closestDistance) {
    //             closestDistance = distance;
    //             closestIndex = index;
    //         }
    //     });

    //     setCenterSlideIndex(closestIndex);
    // }, []);


    function startDrag(
        startEvent: MouseEvent | TouchEvent,
        callback: (data: { slideIndex: number } | null) => void
    ): (moveEvent: MouseEvent | TouchEvent | null) => void {
        const isTouch = "touches" in startEvent;
        const startX = isTouch ? (startEvent as TouchEvent).touches[0].clientX : (startEvent as MouseEvent).clientX;

        return (moveEvent: MouseEvent | TouchEvent | null) => {
            if (moveEvent === null) return callback(null);
            const moveX = ("touches" in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX) - startX;
            callback({ slideIndex: moveX });
        };
    }

    const initDrag = useCallback((callback: (data: { slideIndex: number } | null) => void) => {
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

    const getDistance = useCallback((callback: (data: { slideIndex: number } | null) => void) => {
        if (!containerRef.current) return;
        const event = initDrag(callback);
        containerRef.current.addEventListener("mousedown", event as EventListener);
        containerRef.current.addEventListener("touchstart", event as EventListener, { passive: false });
    }, [initDrag]);

    const calcPos = useCallback((slideIndex: number) => {
        if (!containerRef.current) return 0;

        const containerCenter = sizeContainer / 2;
        const slideCenter = sizeSlides.width / 2;

        return containerCenter + slideIndex * spacebetweenSlides - slideCenter;
    }, [spacebetweenSlides, sizeContainer, sizeSlides.width]);


    const updateslides = useCallback((slide: HTMLImageElement, data: PositionData) => {
        console.log("UPDATE_SLIDE_INDEX: ", data.slideIndex)
        if (data.slideIndex != null) slide.setAttribute("data-x", data.slideIndex.toString());
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
    }, []);

    const calcScale = useCallback((slideIndex: number) => {
        const formula = 1 - (1 / 5) * Math.pow(slideIndex, 2);
        return formula <= 0 ? 0 : formula;
    }, []);

    const checkOrdering = useCallback((
        slide: HTMLImageElement,    // Текущий перемещаемый слайд (HTML элемент)
        currentX: number,           // Текущая позиция слайда по оси X
        xDist: number,              // Расстояние, на которое перемещается слайд
        centerIndex: number         // Индекс центрального слайда (опорная точка)
    ) => {
        const original = parseInt(slide.dataset.x || "0"); // Получаем исходную позицию слайда из data-атрибута (или 0, если не указано)
        const rounded = Math.abs(xDist) >= 0.3 ? Math.sign(xDist) : 0;
        let newX = currentX;    // Инициализируем новую позицию текущим значением
        const totalX = currentX + rounded; // Текущая позиция + смещение

        if (currentX !== currentX + rounded) { // Проверяем, изменилась ли позиция после округления
            if (totalX > original) {  // Если слайд переместился вправо от исходной позиции и за границу центра
                //newX = ((totalX - 1) - centerIndex) - rounded + -centerIndex;
                if (currentX === Math.max(...indexArray.current)) {
                    newX = Math.min(...indexArray.current)
                } else {
                    newX = currentX + 1
                }
            } else if (totalX < original) { // Если слайд переместился влево от исходной позиции и за границу центра
                //newX = ((totalX + 1) + centerIndex) - rounded + centerIndex;
                if (currentX === Math.min(...indexArray.current)) {
                    newX = Math.max(...indexArray.current)
                } else {
                    newX = currentX - 1
                }
            }

            console.log("CHECK_ORIGINAL: ", original, "CURRENT_X: ", currentX, "NEW_X: ", newX, "ROUNDED: ", rounded)
            xScale.current[newX] = slide;
            //console.log("CHECK_X_SCALE: ", xScale.current[newX + rounded])
        }

        const temp = -Math.abs(newX);
        updateslides(slide, { zIndex: temp });

        //console.log("CHECK_SLIDE_INDEX: ", newX, currentX)

        return newX;
    }, [updateslides]);

    const build = useCallback(() => {
        if (!slideRefs.current[0] || !containerRef.current) return;

        let centerIndex: number;

        if (slideRefs.current.length % 2 === 0) {
            centerIndex = slideRefs.current.length / 2
        }
        else {
            centerIndex = (slideRefs.current.length - 1) / 2;
        }
        //console.log("BUILD_CENTER_INDEX: ", centerIndex)
        //setCenterSlideIndex(Math.floor(centerIndex));
        for (let i = 0; i < slideRefs.current.length; i++) {
            const slide = slideRefs.current[i];
            if (!slide) continue;

            const slideIndex = i - centerIndex;
            indexArray.current.add(slideIndex)

            //console.log("SLIDE_INDEX: ", slideIndex)
            //console.log("BUILD_INDEX_ARRAY: ", indexArray.current)

            const scale = calcScale(slideIndex);
            const zIndex = -(Math.abs(i - centerIndex));
            const leftPos = calcPos(slideIndex);

            xScale.current[slideIndex] = slide;

            //console.log("X_SCALE: ", xScale.current[slideIndex])

            updateslides(slide, {
                slideIndex,
                scale,
                leftPos,
                zIndex,
            });
        }
    }, [calcScale, calcPos, updateslides]);

    const moveSlides = useCallback((data: { slideIndex: number } | null) => {
        if (!slideRefs.current[0] || !containerRef.current) return;

        let centerIndex: number;

        if (slideRefs.current.length % 2 === 0) {
            centerIndex = slideRefs.current.length / 2
        }
        else {
            centerIndex = (slideRefs.current.length - 1) / 2;
        }

        let xDist: number;

        if (data != null) {
            containerRef.current.classList.remove("smooth-return");
            xDist = data.slideIndex / 250;
        } else {
            //updateCenterSlide();
            containerRef.current.classList.add("smooth-return");
            xDist = 0;


            for (const x in xScale.current) {
                const slide = xScale.current[x];
                if (slide) {
                    updateslides(slide, {
                        slideIndex: parseInt(x),
                        zIndex: Math.abs(Math.abs(parseInt(x)) - centerIndex),
                    });
                }
            }
        }

        for (let i = 0; i < slideRefs.current.length; i++) {
            const slide = slideRefs.current[i];
            if (!slide) continue;

            const currentX = parseInt(slide.dataset.x || "0");
            const x = checkOrdering(slide, currentX, xDist, centerIndex);
            const scale = calcScale(x + xDist);
            const leftPos = calcPos(x + xDist);

            updateslides(slide, {
                scale,
                leftPos,
            });
        }
    }, [calcScale, calcPos, checkOrdering, updateslides]);

    useEffect(() => {
        build();
        getDistance(moveSlides);
        //updateCenterSlide();
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
                }}>
                {slides}
            </div>
            <div className='text'>
                {texts[0]}
            </div>
        </div>
    );
}

export default Slider;