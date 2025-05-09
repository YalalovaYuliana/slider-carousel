import React from 'react'
import { useState, useEffect } from 'react'
import './ImageSlider.css'
import img1 from '/src/assets/img1.jpg'
import img2 from '/src/assets/img2.jpeg'
import img3 from '/src/assets/img3.jpeg'
import img4 from '/src/assets/img4.jpg'
import img5 from '/src/assets/img5.jpg'

const imageArray = [img1, img2, img3, img4, img5]

const ImageSlider2 = () => {
    const [midImage, setMidImage] = useState(0);
    const [rightImage, setRightImage] = useState(1);
    const [leftImage, setLeftImage] = useState(imageArray.length - 1);

    useEffect(() => {
        if (midImage == 0) {
            setLeftImage(imageArray.length - 1)
            setRightImage(1);
        }
        else if (midImage == imageArray.length - 1) {
            setRightImage(0);
            setLeftImage(midImage - 1);
        }
        else {
            setRightImage(midImage + 1);
            setLeftImage(midImage - 1);
        }

    }, [midImage]);

    const increment = () => {
        if (midImage == imageArray.length - 1) {
            setMidImage(0);
        }
        else {
            setMidImage(midImage + 1);
        }
    }
    const decrement = () => {
        if (midImage == 0) {
            setMidImage(imageArray.length - 1);
        }
        else {
            setMidImage(midImage - 1);
        }
    }

    return (

        <div className="ImageSliderContainter">
            <div className="Images">
                <img onClick={increment} src={imageArray[rightImage]} className="rightImage" />
                <img src={imageArray[midImage]} className="middleImage" />
                <img onClick={decrement} src={imageArray[leftImage]} className="leftImage" />
            </div>
        </div>
    )
}

export default ImageSlider2