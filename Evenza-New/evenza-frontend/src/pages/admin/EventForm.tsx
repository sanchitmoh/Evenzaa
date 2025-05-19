import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, TextField, Button, Paper, Grid, MenuItem,
  FormControl, InputLabel, Select, CircularProgress, Snackbar, Alert,
  FormHelperText, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { Save, ArrowBack, CloudUpload } from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin';
// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dgc5k4be5'; 
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; 
// IMPORTANT: Never include API keys or secrets in frontend code

const initialCommonState = {
  id: '',
  title: '',
  description: '',
  date: null,
  time: null,
  venue: '',
  price: '',
  location: '',
  category: '',
  imageUrl: '',
};

const initialMovieState = {
  ...initialCommonState,
  category: 'MOVIE',
  genre: '',
  releaseDate: null,
  rating: '',
  duration: '',
  cast: '',
  director: '',
  language: '',
};

const initialConcertState = {
  ...initialCommonState,
  category: 'CONCERT',
  artist: '',
  genre: '',
  openingAct: '',
  duration: '',
  capacity: '',
};

const initialSportState = {
  ...initialCommonState,
  category: 'SPORT',
  sportType: '',
  teams: '',
  league: '',
  season: '',
  capacity: '',
};

export default function EventForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const eventType = queryParams.get('type') || 'event';
  
  const isEditMode = !!id;
  const formTitle = isEditMode 
    ? `Edit ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}` 
    : `Add New ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;

  const [formData, setFormData] = useState(
    eventType === 'movie' ? initialMovieState :
    eventType === 'concert' ? initialConcertState :
    eventType === 'sport' ? initialSportState :
    initialCommonState
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  // Add a state to track if image is uploading
  const [imageUploading, setImageUploading] = useState(false);

  // Ensure the category is set based on eventType for new entities
  useEffect(() => {
    if (!isEditMode) {
      // Set the category based on the event type from the URL
      let category = 'EVENT';
      
      if (eventType === 'movie') category = 'MOVIE';
      else if (eventType === 'concert') category = 'CONCERT';
      else if (eventType === 'sport') category = 'SPORT';
      
      setFormData(prev => ({
        ...prev,
        category
      }));
    }
  }, [eventType, isEditMode]);

  // Fetch event data when editing
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      
      let endpoint = `${API_BASE_URL}/events/${id}`;
      
      if (eventType === 'movie') {
        endpoint = `${API_BASE_URL}/movies/${id}`;
      } else if (eventType === 'concert') {
        endpoint = `${API_BASE_URL}/concerts/${id}`;
      } else if (eventType === 'sport') {
        endpoint = `${API_BASE_URL}/sports/${id}`;
      }
      
      axios.get(endpoint)
        .then(response => {
          const data = response.data;
          
          // Format date and time
          if (data.date) {
            data.date = new Date(data.date);
          }
          
          if (data.time) {
            // Convert time string to Date object
            const [hours, minutes] = data.time.split(':');
            const timeDate = new Date();
            timeDate.setHours(parseInt(hours, 10));
            timeDate.setMinutes(parseInt(minutes, 10));
            data.time = timeDate;
          }
          
          if (data.releaseDate) {
            data.releaseDate = new Date(data.releaseDate);
          }
          
          // Map imageurl (backend) to imageUrl (frontend)
          if (data.imageurl) {
            data.imageUrl = data.imageurl;
            setImagePreview(data.imageurl);
          }
          
          setFormData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(`Error fetching ${eventType}:`, err);
          setError(`Failed to fetch ${eventType} details.`);
          setLoading(false);
        });
    }
  }, [id, isEditMode, eventType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear validation error for this field when value changes
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date, fieldName) => {
    setFormData(prevState => ({
      ...prevState,
      [fieldName]: date
    }));
    
    // Clear validation error for this field when value changes
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  // Helper function to validate URL format
  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  const validate = () => {
    const errors = {};
    
    // Common validations
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';
    if (!formData.venue) errors.venue = 'Venue is required';
    if (!formData.location) errors.location = 'Location is required';
    if (!formData.category) errors.category = 'Category is required';
    
    // Price validation
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    // Image URL validation - now checking for Cloudinary URL
    if (!formData.imageUrl) {
      errors.imageUrl = 'Please upload an image using Cloudinary';
    }
    
    // Type-specific validations
    if (eventType === 'movie') {
      if (!formData.genre) errors.genre = 'Genre is required';
      if (!formData.releaseDate) errors.releaseDate = 'Release date is required';
      if (!formData.duration) errors.duration = 'Duration is required';
      if (!formData.director) errors.director = 'Director is required';
      if (!formData.language) errors.language = 'Language is required';
    } else if (eventType === 'concert') {
      if (!formData.artist) errors.artist = 'Artist is required';
      if (!formData.genre) errors.genre = 'Genre is required';
      if (!formData.duration) errors.duration = 'Duration is required';
    } else if (eventType === 'sport') {
      if (!formData.sportType) errors.sportType = 'Sport type is required';
      if (!formData.teams) errors.teams = 'Teams are required';
      if (!formData.league) errors.league = 'League is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      setSnackbar({
        open: true,
        message: 'Please correct the errors in the form',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for submission
      const preparedData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      // Map imageUrl to imageurl to match backend model field name
      if (formData.imageUrl) {
        preparedData.imageurl = formData.imageUrl;
        delete preparedData.imageUrl; // Remove the camelCase version
      }
      
      // The user can change the category, which will override 
      // any default category that might be set by the service
      // This allows switching between different event types
      
      // Format genre and cast as JSON arrays if they're strings
      if (eventType === 'movie' || eventType === 'concert') {
        // Convert genre to a JSON array if it's a comma-separated string
        if (typeof preparedData.genre === 'string' && preparedData.genre) {
          try {
            // If it's already a JSON string, leave it as is
            if (preparedData.genre.trim().startsWith('[') && preparedData.genre.trim().endsWith(']')) {
              // It's already a JSON array string
              console.log('Genre is already in JSON format');
            } else {
              // Convert comma-separated string to JSON array
              const genreArray = preparedData.genre.split(',').map(item => item.trim());
              preparedData.genre = JSON.stringify(genreArray);
              console.log('Converted genre to JSON array:', preparedData.genre);
            }
          } catch (err) {
            console.error('Error formatting genre:', err);
          }
        }
        
        // Convert cast to a JSON array if it's a comma-separated string
        if (typeof preparedData.cast === 'string' && preparedData.cast) {
          try {
            // If it's already a JSON string, leave it as is
            if (preparedData.cast.trim().startsWith('[') && preparedData.cast.trim().endsWith(']')) {
              // It's already a JSON array string
              console.log('Cast is already in JSON format');
            } else {
              // Convert comma-separated string to JSON array
              const castArray = preparedData.cast.split(',').map(item => item.trim());
              preparedData.cast = JSON.stringify(castArray);
              console.log('Converted cast to JSON array:', preparedData.cast);
            }
          } catch (err) {
            console.error('Error formatting cast:', err);
          }
        }
      }
      
      // Format date and time for API
      if (preparedData.date) {
        preparedData.date = preparedData.date.toISOString().split('T')[0];
      }
      
      if (preparedData.time) {
        preparedData.time = new Date(preparedData.time)
          .toTimeString()
          .split(' ')[0]
          .substring(0, 5);
      }
      
      if (preparedData.releaseDate) {
        preparedData.releaseDate = preparedData.releaseDate.toISOString().split('T')[0];
      }
      
      // Convert capacity to integer if it exists
      if (preparedData.capacity) {
        preparedData.capacity = parseInt(preparedData.capacity, 10);
      }
      
      // Determine API endpoint
      let endpoint = '';
      if (eventType === 'movie') {
        endpoint = isEditMode ? `${API_BASE_URL}/movies/${id}` : `${API_BASE_URL}/movies`;
      } else if (eventType === 'concert') {
        endpoint = isEditMode ? `${API_BASE_URL}/concerts/${id}` : `${API_BASE_URL}/concerts`;
      } else if (eventType === 'sport') {
        endpoint = isEditMode ? `${API_BASE_URL}/sports/${id}` : `${API_BASE_URL}/sports`;
      } else {
        endpoint = isEditMode ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;
      }
      
      // Make API call
      const response = isEditMode 
        ? await axios.put(endpoint, preparedData)
        : await axios.post(endpoint, preparedData);
      
      // Extract and log the generated ID after creation
      const savedEntity = response.data;
      const entityId = savedEntity.id;
      console.log(`${eventType} saved successfully with ID: ${entityId}`);
      
      // Show success message with ID for new entities
      setSnackbar({
        open: true,
        message: isEditMode 
          ? `${eventType} updated successfully` 
          : `${eventType} created successfully with ID: ${entityId}`,
        severity: 'success'
      });
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/admin/events');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving data:', err);
      setSnackbar({
        open: true,
        message: `Failed to save ${eventType}: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to open Cloudinary widget
  const openCloudinaryWidget = () => {
    setImageUploading(true);
    
    // Create and open the Cloudinary widget
    const widget = window.cloudinary?.createUploadWidget(
      {
        cloudName: 'dgc5k4be5',
        uploadPreset: 'ml_default',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        resourceType: 'image',
        maxFileSize: 5000000, // 5MB limit
        // Additional options for better experience
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0E2F5A",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#5265ff",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1"
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: "https://fonts.googleapis.com/css?family=Poppins",
              active: true
            }
          }
        },
        // Image transformations
        eager: [
          { width: 800, crop: "scale" }, // For large displays
          { width: 400, crop: "scale" }  // For mobile displays
        ],
        // Auto-tag uploaded images
        auto_tagging: true,
        folder: "evenza_events"
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          // Get the secure URL from the upload result
          const secureUrl = result.info.secure_url;
          
          // Update form data with the Cloudinary URL
          setFormData(prevState => ({
            ...prevState,
            imageUrl: secureUrl
          }));
          
          // Set image preview
          setImagePreview(secureUrl);
          
          // Clear any validation errors for imageUrl
          if (validationErrors.imageUrl) {
            setValidationErrors(prev => ({
              ...prev,
              imageUrl: null
            }));
          }
          
          console.log('Image uploaded successfully to Cloudinary:', secureUrl);
          setImageUploading(false);
        } else if (result && result.event === 'close') {
          setImageUploading(false);
        }
      }
    );

    if (widget) {
      widget.open();
    } else {
      console.error('Cloudinary widget not available. Make sure the script is loaded.');
      setImageUploading(false);
      
      setSnackbar({
        open: true,
        message: 'Image upload feature not available. Please refresh or try again later.',
        severity: 'error'
      });
    }
  };

  // Load Cloudinary script when component mounts
  useEffect(() => {
    // Only load the script if it hasn't been loaded already
    if (!document.getElementById('cloudinary-upload-widget')) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.id = 'cloudinary-upload-widget';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        // Cleanup if needed
        if (document.getElementById('cloudinary-upload-widget')) {
          document.getElementById('cloudinary-upload-widget').remove();
        }
      };
    }
  }, []);

  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">{formTitle}</Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/events')}
          variant="outlined"
        >
          Back to Events
        </Button>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Common fields for all event types */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={!!validationErrors.title}
              helperText={validationErrors.title}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              error={!!validationErrors.venue}
              helperText={validationErrors.venue}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!validationErrors.description}
              helperText={validationErrors.description}
              multiline
              rows={3}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(value) => handleDateChange(value, 'date')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!validationErrors.date,
                    helperText: validationErrors.date
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="Time"
                value={formData.time}
                onChange={(value) => handleDateChange(value, 'time')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!validationErrors.time,
                    helperText: validationErrors.time
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={!!validationErrors.price}
              helperText={validationErrors.price}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={!!validationErrors.location}
              helperText={validationErrors.location}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={!!validationErrors.category}
              helperText={validationErrors.category || "Enter a category like 'MOVIE', 'CONCERT', 'SPORT', etc."}
              required
              placeholder="e.g. MOVIE, CONCERT, SPORT"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Event Image
              </Typography>
            </Divider>
            
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUpload />}
                onClick={openCloudinaryWidget}
                disabled={imageUploading}
                sx={{ mb: 2 }}
              >
                {imageUploading ? 'Uploading...' : 'Upload Image to Cloudinary'}
              </Button>
              
              {formData.imageUrl && (
                <TextField
                  fullWidth
                  label="Image URL"
                  name="imageUrl"
                  value={formData.imageUrl}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  helperText="This URL was generated from Cloudinary"
                />
              )}
              
              {imagePreview && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                    onError={() => {
                      setValidationErrors(prev => ({
                        ...prev,
                        imageUrl: 'Invalid image URL. Please try uploading again.'
                      }));
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Movie specific fields */}
          {eventType === 'movie' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    Movie Details
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  error={!!validationErrors.genre}
                  helperText={validationErrors.genre}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Release Date"
                    value={formData.releaseDate}
                    onChange={(value) => handleDateChange(value, 'releaseDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!validationErrors.releaseDate,
                        helperText: validationErrors.releaseDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (e.g. 2h 30m)"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  error={!!validationErrors.duration}
                  helperText={validationErrors.duration}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rating"
                  name="rating"
                  type="number"
                  value={formData.rating}
                  onChange={handleChange}
                  error={!!validationErrors.rating}
                  helperText={validationErrors.rating}
                  inputProps={{ step: '0.1', min: '0', max: '10' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Director"
                  name="director"
                  value={formData.director}
                  onChange={handleChange}
                  error={!!validationErrors.director}
                  helperText={validationErrors.director}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  error={!!validationErrors.language}
                  helperText={validationErrors.language}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cast (comma separated)"
                  name="cast"
                  value={formData.cast}
                  onChange={handleChange}
                  error={!!validationErrors.cast}
                  helperText={validationErrors.cast}
                />
              </Grid>
            </>
          )}
          
          {/* Concert specific fields */}
          {eventType === 'concert' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    Concert Details
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Artist/Band"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  error={!!validationErrors.artist}
                  helperText={validationErrors.artist}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  error={!!validationErrors.genre}
                  helperText={validationErrors.genre}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (e.g. 2h 30m)"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  error={!!validationErrors.duration}
                  helperText={validationErrors.duration}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  error={!!validationErrors.capacity}
                  helperText={validationErrors.capacity}
                  inputProps={{ min: '0' }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Opening Act"
                  name="openingAct"
                  value={formData.openingAct}
                  onChange={handleChange}
                />
              </Grid>
            </>
          )}
          
          {/* Sport specific fields */}
          {eventType === 'sport' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    Sport Event Details
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sport Type"
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  error={!!validationErrors.sportType}
                  helperText={validationErrors.sportType}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teams"
                  name="teams"
                  value={formData.teams}
                  onChange={handleChange}
                  placeholder="e.g. Team A vs Team B"
                  error={!!validationErrors.teams}
                  helperText={validationErrors.teams}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="League"
                  name="league"
                  value={formData.league}
                  onChange={handleChange}
                  error={!!validationErrors.league}
                  helperText={validationErrors.league}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Season"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  placeholder="e.g. 2024-2025"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  inputProps={{ min: '0' }}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<Save />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : isEditMode ? 'Update' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </form>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
} 