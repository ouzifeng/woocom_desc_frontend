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
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        // Get location data directly from ipapi.co
        const locationResponse = await axios.get('https://ipapi.co/json/');
        const location = locationResponse.data;

        // Get weather data using the coordinates
        const weatherResponse = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location.latitude},${location.longitude}&aqi=no`
        );
        
        if (weatherResponse.data && weatherResponse.data.current) {
          setWeather(weatherResponse.data);
        } else {
          setError('Invalid weather data received');
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError(error.response?.data?.error?.message || 'Failed to fetch weather data');
      }
    };

    if (apiKey) {
      fetchLocationAndWeather();
    } else {
      setError('Weather API key not found');
    }
  }, [apiKey]);

  if (error) {
    return <Typography variant="caption" color="error">{error}</Typography>;
  }

  if (!weather) {
    return <Typography>..</Typography>;
  }

  // If there's no current weather data, handle gracefully
  if (!weather.current) {
    return <Typography>No weather data available.</Typography>;
  }

  const toggleUnit = () => {
    setUnit((prevUnit) => (prevUnit === 'C' ? 'F' : 'C'));
  };

  const temperature = unit === 'C' 
    ? Math.round(weather.current.temp_c) 
    : Math.round(weather.current.temp_f);

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
