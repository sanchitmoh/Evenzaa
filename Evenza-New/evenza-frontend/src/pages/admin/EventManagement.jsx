import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Tabs, Tab, Paper, Button, IconButton, Dialog, DialogActions, 
  DialogContent, DialogContentText, DialogTitle, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Event, Movie, MusicNote, SportsSoccer } from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin';

// Define sort fields for different entity types
const SORT_FIELDS = {
  all: 'date',
  movie: 'id',  // Changed from releaseDate to id as a workaround
  concert: 'date',
  sport: 'date'
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EventManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState([]);
  const [movies, setMovies] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [sports, setSports] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');

  const getEventsByCategory = (category) => {
    setLoading(true);
    setError(null);
    
    // Get the appropriate sort field for this category
    const sortField = SORT_FIELDS[category] || 'date';
    
    let endpoint;
    if (category === 'all') {
      endpoint = `${API_BASE_URL}/events`;
    } else if (category === 'sport') {
      endpoint = `${API_BASE_URL}/sports`; // Ensure we're using 'sports' plural
      console.log('Fetching sports with endpoint:', endpoint);
    } else {
      endpoint = `${API_BASE_URL}/${category}s`;
    }
      
    console.log(`Fetching ${category} events:`, {
      endpoint,
      sortField,
      page,
      size: rowsPerPage,
      sortDir: sortDirection,
      searchTerm,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Get the token manually to ensure it's included
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found! User may need to log in again.');
      setError('Authentication error: Please log in again');
      setLoading(false);
      return;
    }
      
    axios.get(endpoint, {
      params: {
        page: page,
        size: rowsPerPage,
        sortBy: sortField,
        sortDir: sortDirection,
        keyword: searchTerm || undefined
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      const data = response.data;
      console.log(`Raw API response for ${category}:`, data);
      
      // Helper function to ensure category is set and normalized
      const ensureCategory = (items, defaultCategory) => {
        return items.map(item => {
          const processedItem = {
            ...item,
            category: (item.category || defaultCategory).toUpperCase()
          };
          console.log('Processed item:', processedItem);
          return processedItem;
        });
      };
      
      try {
        if (category === 'sport') {
          // Handle both array and object responses for sports
          let sportsData;
          if (Array.isArray(data)) {
            sportsData = data;
          } else if (data.content) {
            sportsData = data.content;
          } else if (data.sports) {
            sportsData = data.sports;
          } else if (data.sport) {
            sportsData = data.sport;
          } else {
            sportsData = [];
          }
          
          console.log('Sports data before processing:', sportsData);
          const processedSports = ensureCategory(sportsData, 'SPORT');
          console.log('Processed sports data:', processedSports);
          setSports(processedSports);
          setTotalItems(data.totalItems || data.totalElements || sportsData.length || 0);
        } else if (category === 'all') {
          const events = Array.isArray(data) ? data : (data.events || data.content || []);
          setEvents(ensureCategory(events, 'EVENT'));
          setTotalItems(data.totalItems || data.totalElements || events.length || 0);
        } else if (category === 'movie') {
          const movies = Array.isArray(data) ? data : (data.movies || data.content || []);
          setMovies(ensureCategory(movies, 'MOVIE'));
          setTotalItems(data.totalItems || data.totalElements || movies.length || 0);
        } else if (category === 'concert') {
          const concerts = Array.isArray(data) ? data : (data.concerts || data.content || []);
          setConcerts(ensureCategory(concerts, 'CONCERT'));
          setTotalItems(data.totalItems || data.totalElements || concerts.length || 0);
        }
      } catch (err) {
        console.error('Error processing response data:', err);
        setError('Error processing response data. Please try again.');
      }
      
      setLoading(false);
    })
    .catch(err => {
      console.error(`Error fetching ${category}:`, {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        endpoint,
        category
      });
      setError(`Failed to fetch ${category}s. ${err.response?.data?.message || err.message || 'Please try again later.'}`);
      setLoading(false);
    });
  };

  useEffect(() => {
    const categories = ['all', 'movie', 'concert', 'sport'];
    const category = categories[tabValue];
    getEventsByCategory(category);
  }, [tabValue, page, rowsPerPage, sortDirection, searchTerm]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setSearchTerm('');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (item) => {
    console.log('Item to delete:', item);
    if (!item || !item.id) {
      console.error('Delete failed: Item or item ID is missing', item);
      setError('Cannot delete: item is missing an ID');
      return;
    }
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete || !itemToDelete.id) {
      setError('Cannot delete: Event ID is missing');
      setDeleteDialogOpen(false);
      return;
    }
    
    const categories = ['all', 'movie', 'concert', 'sport'];
    const category = categories[tabValue];
    
    let endpoint = `${API_BASE_URL}/events/${itemToDelete.id}`;
    
    if (category !== 'all') {
      endpoint = `${API_BASE_URL}/${category}s/${itemToDelete.id}`;
    }
    
    setLoading(true);
    
    axios.delete(endpoint)
      .then(() => {
        // Refresh data after deletion
        getEventsByCategory(category);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      })
      .catch(err => {
        console.error('Error deleting event:', err);
        setError('Failed to delete event. Please try again later.');
        setLoading(false);
        setDeleteDialogOpen(false);
      });
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const renderEventTable = (data) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Venue</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {loading ? 'Loading...' : 'No events found'}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{item.venue}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Box>
                    <IconButton 
                      component={Link} 
                      to={`/admin/events/${item.id}/edit?type=${(item.category || 'event').toLowerCase()}`} 
                      color="primary" 
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(item)} color="error" size="small">
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </TableContainer>
  );

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Event Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            component={Link}
            to={`/admin/events/new?type=${['event', 'movie', 'concert', 'sport'][tabValue]}`}
          >
            Add New {['Event', 'Movie', 'Concert', 'Sport'][tabValue]}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mr: 2, width: 300 }}
            InputProps={{
              startAdornment: <Search color="action" sx={{ mr: 1 }} />,
            }}
          />
          <Button
            startIcon={<Refresh />}
            onClick={() => setSearchTerm('')}
            variant="outlined"
          >
            Reset
          </Button>
        </Box>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="event management tabs"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<Event />} label="All Events" />
          <Tab icon={<Movie />} label="Movies" />
          <Tab icon={<MusicNote />} label="Concerts" />
          <Tab icon={<SportsSoccer />} label="Sports" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && renderEventTable(events)}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && renderEventTable(movies)}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && renderEventTable(concerts)}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && renderEventTable(sports)}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 