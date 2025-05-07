import Slider from "./components/Slider"
import img1 from '/src/assets/img1.jpg';
import img2 from '/src/assets/img2.jpeg';
import img3 from '/src/assets/img3.jpeg';
import img4 from '/src/assets/img4.jpg';
import img5 from '/src/assets/img5.jpg';

const imageArray: string[] = [img1, img2, img3, img4, img5];

const sliderProps = {
  sizeSlides: {
    width: 250,    // Ширина слайдов
    height: 250    // Высота слайдов
  },
  spacebetweenSlides: 160,  // Расстояние между слайдами
  sizeContainer: 550,       // Ширина контейнера
  imageArray: imageArray  // Массив изображений
};

function App() {
  return (
    <Slider {...sliderProps} />
  )
}

export default App
