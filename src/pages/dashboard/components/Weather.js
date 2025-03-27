import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, styled } from '@mui/material';

const IconBox = styled(Box)(({ theme }) => ({
  width: 40,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  cursor: 'default',
}));

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        // Check if cached data exists and is still valid
        const cachedWeather = localStorage.getItem('weatherData');
        const cachedTimestamp = localStorage.getItem('weatherDataTimestamp');
        const oneHour = 60 * 60 * 1000;

        if (cachedWeather && cachedTimestamp && (Date.now() - cachedTimestamp < oneHour)) {
          setWeather(JSON.parse(cachedWeather));
          return;
        }

        // Get location data directly from ipapi.co
        const locationResponse = await axios.get('https://ipapi.co/json/');
        const location = locationResponse.data;

        // Get weather data using the coordinates
        const weatherResponse = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location.latitude},${location.longitude}&aqi=no`
        );

        if (weatherResponse.data && weatherResponse.data.current) {
          setWeather(weatherResponse.data);
          // Cache the weather data and timestamp
          localStorage.setItem('weatherData', JSON.stringify(weatherResponse.data));
          localStorage.setItem('weatherDataTimestamp', Date.now().toString());
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
      <IconBox>
        <Typography variant="caption">
          {temperature}°{unit}
        </Typography>
      </IconBox>
    </Box>
  );
};

export default Weather;