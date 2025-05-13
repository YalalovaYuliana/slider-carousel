import { useEffect, useState, useRef } from "react";
import Slider from "./components/Slider"
import type Beer from "./components/Beer";
import "@fontsource/roboto/300.css";

function App() {
  const sizeSlides = {
    width: 210,    // Ширина слайдов
    height: 360    // Высота слайдов
  }
  let spacebetweenSlides = 150 // Расстояние между слайдами
  const sizeContainer = 450 // Ширина контейнера

  const [beers, setBeers] = useState<Beer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    setIsLoading(true);

    const cleanDescription = (description: string) => {
      const lastParamEnd = description.lastIndexOf(';');
      return lastParamEnd === -1
        ? description
        : description.slice(lastParamEnd + 1).trim();
    };

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
          const cleanedBeers = data.map(beer => ({
            ...beer,
            description: cleanDescription(beer.description),
          }));
          setBeers(cleanedBeers);
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

  spacebetweenSlides = window.innerWidth <= 768 ? spacebetweenSlides * 2 : spacebetweenSlides;

  const sliderProps = {
    sizeSlides: sizeSlides,
    spacebetweenSlides: spacebetweenSlides,
    sizeContainer: sizeContainer,
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
