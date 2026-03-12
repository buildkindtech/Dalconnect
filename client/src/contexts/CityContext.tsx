import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type City = {
  id: string;
  name: string;
  active: boolean;
};

export const CITIES: City[] = [
  { id: "dallas", name: "달라스-포트워스", active: true },
];

type CityContextType = {
  currentCity: City;
  setCurrentCity: (city: City) => void;
  activeCities: City[];
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  // Get initial city from localStorage or default to Dallas
  const [currentCity, setCurrentCityState] = useState<City>(() => {
    if (typeof window !== 'undefined') {
      const savedCityId = localStorage.getItem('dalconnect-city');
      const savedCity = CITIES.find(city => city.id === savedCityId && city.active);
      if (savedCity) {
        return savedCity;
      }
    }
    return CITIES[0]; // Default to Dallas
  });

  const activeCities = CITIES.filter(city => city.active);

  const setCurrentCity = (city: City) => {
    if (city.active) {
      setCurrentCityState(city);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dalconnect-city', city.id);
      }
    }
  };

  useEffect(() => {
    // Save to localStorage whenever city changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('dalconnect-city', currentCity.id);
    }
  }, [currentCity]);

  return (
    <CityContext.Provider value={{ currentCity, setCurrentCity, activeCities }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCityContext must be used within a CityProvider');
  }
  return context;
}