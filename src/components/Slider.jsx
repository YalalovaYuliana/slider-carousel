import "./Slider.css";
import React, { useCallback, useEffect, useRef } from 'react';
import img1 from '/src/assets/img1.jpg';
import img2 from '/src/assets/img2.jpeg';
import img3 from '/src/assets/img3.jpeg';
import img4 from '/src/assets/img4.jpg';
import img5 from '/src/assets/img5.jpg';

const imageArray = [img1, img2, img3, img4, img5];

function Slider() {
    const sizeSlides = { width: 250, height: 250 } // размер слайда в пикселях
    const spacebetweenSlides = 150  // расстояние между центрами слайдов

    const sizeContainer = sizeSlides.width * 2 // ширина слайдера

    const containerRef = useRef();
    const slideRefs = useRef([]);
    const xScale = useRef({});

    function startDrag(e1, callback) {
        console.log("startDrag")
        const isTouch = "touches" in e1;
        const startX = isTouch ? e1.touches[0].clientX : e1.clientX;

        return e2 => {
            if (e2 === null) return callback(null);
            const moveX = ("touches" in e2 ? e2.touches[0].clientX : e2.clientX) - startX;
            callback({ x: moveX });
        };
    }

    const initDrag = useCallback((callback) => {
        console.log("initDrag")
        let handler;

        return e1 => {
            e1.preventDefault?.();

            handler = startDrag(e1, callback);

            const moveEvent = "touches" in e1 ? "touchmove" : "mousemove";
            const endEvent = "touches" in e1 ? "touchend" : "mouseup";

            window.addEventListener(moveEvent, handler);
            window.addEventListener(endEvent, clearDraggingEvent);

            function clearDraggingEvent() {
                window.removeEventListener(moveEvent, handler);
                window.removeEventListener(endEvent, clearDraggingEvent);
                handler(null);
            }
        };
    }, []);

    const getDistance = useCallback((callback) => {
        if (!containerRef.current) return;
        const event = initDrag(callback);
        containerRef.current.addEventListener("mousedown", event);
        containerRef.current.addEventListener("touchstart", event);
    }, [initDrag]);

    const slides = imageArray.map((image, index) => (
        <img className="slide" style={{ width: sizeSlides.width + 'px', height: sizeSlides.height + 'px' }} src={image} key={index} ref={el => (slideRefs.current[index] = el)} />
    ));

    const calcPos = useCallback((x, scale, slideWidth) => {
        const center = containerRef.current.offsetWidth / 2;
        const position = center + x * spacebetweenSlides - slideWidth / 2;
        return position;
    }, []);

    const updateslides = useCallback((slide, data) => {
        if (data.x != null) slide.setAttribute("data-x", data.x);
        if (data.scale != null) {
            slide.style.transform = `scale(${data.scale})`;
            slide.style.opacity = data.scale === 0 ? 0 : 1;
        }
        if (data.leftPos != null) {
            slide.style.left = `${data.leftPos}px`;
        }
        if (data.zIndex != null) {
            slide.style.zIndex = data.zIndex;
        }
    }, []);

    const calcScale = useCallback((x) => {
        const formula = 1 - 1 / 5 * Math.pow(x, 2);
        return formula <= 0 ? 0 : formula;
    }, []);

    const calcScale2 = useCallback((x) => {
        return x <= 0 ? 1 + x / 5 : 1 - x / 5;
    }, []);

    const checkOrdering = useCallback((slide, x, xDist, centerIndex) => {
        const original = parseInt(slide.dataset.x);
        const rounded = Math.round(xDist);
        let newX = x;

        if (x !== x + rounded) {
            if (x + rounded > original && x + rounded > centerIndex) {
                newX = ((x + rounded - 1) - centerIndex) - rounded + -centerIndex;
            } else if (x + rounded < original && x + rounded < -centerIndex) {
                newX = ((x + rounded + 1) + centerIndex) - rounded + centerIndex;
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
        const slideWidth = slideRefs.current[0].offsetWidth;

        for (let i = 0; i < slideRefs.current.length; i++) {
            const x = i - centerIndex;
            const scale = calcScale(x);
            const scale2 = calcScale2(x);
            const zIndex = -(Math.abs(i - centerIndex));
            const leftPos = calcPos(x, scale2, slideWidth);

            xScale.current[x] = slideRefs.current[i];

            updateslides(slideRefs.current[i], {
                x,
                scale,
                leftPos,
                zIndex
            });
        }
    }, [calcScale, calcScale2, calcPos, updateslides]);

    const moveslides = useCallback((data) => {
        console.log("moveslides")
        if (!slideRefs.current[0] || !containerRef.current) return;

        const centerIndex = (slideRefs.current.length - 1) / 2;
        let xDist;

        if (data != null) {
            containerRef.current.classList.remove("smooth-return");
            xDist = data.x / 250;
        } else {
            containerRef.current.classList.add("smooth-return");
            xDist = 0;

            for (let x in xScale.current) {
                updateslides(xScale.current[x], {
                    x: x,
                    zIndex: Math.abs(Math.abs(x) - centerIndex)
                });
            }
        }

        const slideWidth = slideRefs.current[0].offsetWidth;

        for (let i = 0; i < slideRefs.current.length; i++) {
            const x = checkOrdering(slideRefs.current[i], parseInt(slideRefs.current[i].dataset.x), xDist, centerIndex);
            const scale = calcScale(x + xDist);
            const scale2 = calcScale2(x + xDist);
            const leftPos = calcPos(x + xDist, scale2, slideWidth);

            updateslides(slideRefs.current[i], {
                scale,
                leftPos
            });
        }
    }, [calcScale, calcScale2, calcPos, checkOrdering, updateslides]);

    useEffect(() => {
        build();
        getDistance(moveslides);

        return () => {
            if (containerRef.current) {
                const event = initDrag(moveslides);
                containerRef.current.removeEventListener("mousedown", event);
                containerRef.current.removeEventListener("touchstart", event);
            }
        };
    }, [build, getDistance, initDrag, moveslides]);

    return (
        <div >
            <div ref={containerRef} className="container" style={{ width: sizeContainer + 'px', height: sizeSlides.height + 'px' }}>
                {slides}
            </div>
        </div >
    );
}

export default Slider;
