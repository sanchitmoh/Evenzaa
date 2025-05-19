import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/events";

export const fetchEvents = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};
