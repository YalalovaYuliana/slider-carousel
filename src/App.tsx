import { useEffect, useState, useRef } from "react";
import Slider from "./components/Slider"
import type Beer from "./components/Beer";

function App() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    setIsLoading(true);

    const config = {
      baseUrl: 'https://backend.ponarth.com/api/site/beer/all',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    fetch(config.baseUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Ошибка: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const updatedBeers = [...data];
          setBeers(updatedBeers);
        } else {
          console.error("Нет данных о пиве");
        }
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      })
  }, []);

  const sliderProps = {
    sizeSlides: {
      width: 250,    // Ширина слайдов
      height: 300    // Высота слайдов
    },
    spacebetweenSlides: 160,  // Расстояние между слайдами
    sizeContainer: 450,       // Ширина контейнера
    beers: beers,  // Массив изображений
  };

  if (isLoading) {
    return (
      <div><span>Загрузка</span></div>
    )
  }
  return (
    <Slider {...sliderProps} />
  )

}

export default App
