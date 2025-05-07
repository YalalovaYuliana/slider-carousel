import { useCallback, useEffect, useRef, useMemo } from 'react';
import './Slider.css'
import img1 from '/src/assets/img1.jpg';
import img2 from '/src/assets/img2.jpeg';
import img3 from '/src/assets/img3.jpeg';
import img4 from '/src/assets/img4.jpg';
import img5 from '/src/assets/img5.jpg';

const imageArray: string[] = [img1, img2, img3, img4, img5];

type PositionData = {
    x?: number;
    scale?: number;
    leftPos?: number;
    zIndex?: number;
};

type XScaleRef = {
    [key: number]: HTMLImageElement | null;
};

function Slider() {
    const sizeSlides = { width: 250, height: 250 }; // размер слайда в пикселях
    const spacebetweenSlides: number = 160; // расстояние между центрами слайдов
    const sizeContainer: number = 550; // ширина слайдера

    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
    const xScale = useRef<XScaleRef>({});

    const slides = useMemo(() => imageArray.map((image, index) => (
        <img className="slide"
            style={{
                width: `${sizeSlides.width}px`,
                height: `${sizeSlides.height}px`
            }}
            key={index}
            src={image}
            ref={ref => {
                if (slideRefs.current) {
                    slideRefs.current[index] = ref;
                }
            }}
            alt={`Slide ${index}`} />
    )), [sizeSlides.width, sizeSlides.height]);

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
        const position = center + x * spacebetweenSlides - slideWidth / 2;
        return position;
    }, [spacebetweenSlides]);

    const updateslides = useCallback((slide: HTMLImageElement, data: PositionData) => {
        if (data.x != null) slide.setAttribute("data-x", data.x.toString());
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

    const calcScale = useCallback((x: number) => {
        const formula = 1 - (1 / 5) * Math.pow(x, 2);
        return formula <= 0 ? 0 : formula;
    }, []);

    const checkOrdering = useCallback((
        slide: HTMLImageElement,    // Текущий перемещаемый слайд (HTML элемент)
        currentX: number,           // Текущая позиция слайда по оси X
        xDist: number,              // Расстояние, на которое перемещается слайд
        centerIndex: number         // Индекс центрального слайда (опорная точка)
    ) => {
        console.log(currentX, xDist, centerIndex)
        const original = parseInt(slide.dataset.x || "0"); // Получаем исходную позицию слайда из data-атрибута (или 0, если не указано)
        const rounded = Math.round(xDist);  // Округляем расстояние перемещения для целочисленных расчетов
        let newX = currentX;    // Инициализируем новую позицию текущим значением
        const totalX = currentX + rounded; // Текущая позиция + смещение

        if (currentX !== currentX + rounded) { // Проверяем, изменилась ли позиция после округления
            if (totalX > original && totalX > centerIndex) {  // Если слайд переместился вправо от исходной позиции И за границу центра
                newX = ((totalX - 1) - centerIndex) - rounded + -centerIndex;
            } else if (totalX < original && totalX < -centerIndex) { // Если слайд переместился влево от исходной позиции И за границу центра
                newX = ((totalX + 1) + centerIndex) - rounded + centerIndex;
            }

            xScale.current[newX + rounded] = slide;    // Сохраняем связь между позицией и слайдом в ref-объекте
        }

        const temp = -Math.abs(newX + rounded);
        updateslides(slide, { zIndex: temp });

        return newX;
    }, [updateslides]);

    const build = useCallback(() => {
        if (!slideRefs.current[0] || !containerRef.current) return;

        const centerIndex = (slideRefs.current.length - 1) / 2;
        const slideWidth = slideRefs.current[0].offsetWidth;

        for (let i = 0; i < slideRefs.current.length; i++) {
            const slide = slideRefs.current[i];
            if (!slide) continue;

            const x = i - centerIndex;
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
    }, [calcScale, calcPos, updateslides]);

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

        const slideWidth = slideRefs.current[0].offsetWidth;

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
    }, [calcScale, calcPos, checkOrdering, updateslides]);

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
    );
}

export default Slider;