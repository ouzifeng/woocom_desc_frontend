import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, styled } from '@mui/material';

const IconBox = styled(Box)(({ theme }) => ({
  // Match the dimensions & border style of your other icons:
  width: 40,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.divider}`, // or a custom color
  borderRadius: theme.shape.borderRadius,       // or a custom radius
  backgroundColor: theme.palette.background.paper, // or transparent
  cursor: 'default', // so it behaves more like an icon
}));

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState('C'); // State to track the unit (Celsius or Fahrenheit)
  const apiKey = process.env.WEATHER_API_KEY

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        // Fetch the user's IP address and location
        const locationResponse = await axios.get('https://ipapi.co/json/');
        const location = locationResponse.data;

        // Fetch the weather data using the location
        const weatherResponse = await axios.get(
          `http://api.weatherstack.com/current?access_key=${apiKey}&query=${location.city}`
        );
        setWeather(weatherResponse.data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchLocationAndWeather();
  }, []);

  if (!weather) {
    return <Typography>..</Typography>;
  }

  // If there's no `weather.current` for some reason, handle gracefully:
  if (!weather.current) {
    return <Typography>No weather data available.</Typography>;
  }

  const toggleUnit = () => {
    setUnit((prevUnit) => (prevUnit === 'C' ? 'F' : 'C'));
  };

  const temperature = unit === 'C' 
    ? Math.round(weather.current.temperature) 
    : Math.round((weather.current.temperature * 9/5) + 32);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={toggleUnit}>
      {/* This small circular box looks like an icon */}
      <IconBox>
        <Typography variant="caption">
          {temperature}°{unit}
        </Typography>
      </IconBox>
    </Box>
  );
};

export default Weather;
