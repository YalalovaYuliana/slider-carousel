import "./Slider.css";
import React, { useCallback, useEffect, useRef } from 'react';
import img1 from '/src/assets/img1.jpg';
import img2 from '/src/assets/img2.jpeg';
import img3 from '/src/assets/img3.jpeg';
import img4 from '/src/assets/img4.jpg';
import img5 from '/src/assets/img5.jpg';

const imageArray = [img1, img2, img3, img4, img5];

function Slider() {
    const containerRef = useRef();
    const cardRefs = useRef([]);
    const xScale = useRef({});

    function startDrag(e1, callback) {
        const isTouch = "touches" in e1;
        const startX = isTouch ? e1.touches[0].clientX : e1.clientX;

        return e2 => {
            if (e2 === null) return callback(null);
            const moveX = ("touches" in e2 ? e2.touches[0].clientX : e2.clientX) - startX;
            callback({ x: moveX });
        };
    }

    const initDrag = useCallback((callback) => {
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

    const cards = imageArray.map((image, index) => (
        <img className="card" src={image} key={index} ref={el => (cardRefs.current[index] = el)} />
    ));

    const calcPos = useCallback((x, scale, cardWidth) => {
        const spacing = 150; // расстояние между центрами карточек
        const center = containerRef.current.offsetWidth / 2;
        const position = center + x * spacing - cardWidth / 2;
        return position;
    }, []);

    const updateCards = useCallback((card, data) => {
        if (data.x != null) card.setAttribute("data-x", data.x);
        if (data.scale != null) {
            card.style.transform = `scale(${data.scale})`;
            card.style.opacity = data.scale === 0 ? 0 : 1;
        }
        if (data.leftPos != null) {
            card.style.left = `${data.leftPos}px`;
        }
        if (data.zIndex != null) {
            card.style.zIndex = data.zIndex;
        }
    }, []);

    const calcScale = useCallback((x) => {
        const formula = 1 - 1 / 5 * Math.pow(x, 2);
        return formula <= 0 ? 0 : formula;
    }, []);

    const calcScale2 = useCallback((x) => {
        return x <= 0 ? 1 + x / 5 : 1 - x / 5;
    }, []);

    const checkOrdering = useCallback((card, x, xDist, centerIndex) => {
        const original = parseInt(card.dataset.x);
        const rounded = Math.round(xDist);
        let newX = x;

        if (x !== x + rounded) {
            if (x + rounded > original && x + rounded > centerIndex) {
                newX = ((x + rounded - 1) - centerIndex) - rounded + -centerIndex;
            } else if (x + rounded < original && x + rounded < -centerIndex) {
                newX = ((x + rounded + 1) + centerIndex) - rounded + centerIndex;
            }

            xScale.current[newX + rounded] = card;
        }

        const temp = -Math.abs(newX + rounded);
        updateCards(card, { zIndex: temp });

        return newX;
    }, [updateCards]);

    const build = useCallback(() => {
        if (!cardRefs.current[0] || !containerRef.current) return;

        const centerIndex = (cardRefs.current.length - 1) / 2;
        const cardWidth = cardRefs.current[0].offsetWidth;

        for (let i = 0; i < cardRefs.current.length; i++) {
            const x = i - centerIndex;
            const scale = calcScale(x);
            const scale2 = calcScale2(x);
            const zIndex = -(Math.abs(i - centerIndex));
            const leftPos = calcPos(x, scale2, cardWidth);

            xScale.current[x] = cardRefs.current[i];

            updateCards(cardRefs.current[i], {
                x,
                scale,
                leftPos,
                zIndex
            });
        }
    }, [calcScale, calcScale2, calcPos, updateCards]);

    const moveCards = useCallback((data) => {
        if (!cardRefs.current[0] || !containerRef.current) return;

        const centerIndex = (cardRefs.current.length - 1) / 2;
        let xDist;

        if (data != null) {
            containerRef.current.classList.remove("smooth-return");
            xDist = data.x / 250;
        } else {
            containerRef.current.classList.add("smooth-return");
            xDist = 0;

            for (let x in xScale.current) {
                updateCards(xScale.current[x], {
                    x: x,
                    zIndex: Math.abs(Math.abs(x) - centerIndex)
                });
            }
        }

        const cardWidth = cardRefs.current[0].offsetWidth;

        for (let i = 0; i < cardRefs.current.length; i++) {
            const x = checkOrdering(cardRefs.current[i], parseInt(cardRefs.current[i].dataset.x), xDist, centerIndex);
            const scale = calcScale(x + xDist);
            const scale2 = calcScale2(x + xDist);
            const leftPos = calcPos(x + xDist, scale2, cardWidth);

            updateCards(cardRefs.current[i], {
                scale,
                leftPos
            });
        }
    }, [calcScale, calcScale2, calcPos, checkOrdering, updateCards]);

    useEffect(() => {
        build();
        getDistance(moveCards);

        return () => {
            if (containerRef.current) {
                const event = initDrag(moveCards);
                containerRef.current.removeEventListener("mousedown", event);
                containerRef.current.removeEventListener("touchstart", event);
            }
        };
    }, [build, getDistance, initDrag, moveCards]);

    return (
        <div ref={containerRef} className="container">
            <div className="card-carousel">
                {cards}
            </div>
        </div>
    );
}

export default Slider;
