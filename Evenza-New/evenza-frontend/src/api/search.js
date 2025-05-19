// search.js
import axios from 'axios';

const API_URL = '/api/search';

// Function to perform a search query
const search = async (query) => {
  try {
    const response = await axios.get(API_URL, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Error while searching:', error);
    throw error;
  }
};

const searchService = {
  search,
};

export default searchService;