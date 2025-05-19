import axios from "axios";

const AUTH_API_BASE_URL = "http://localhost:8080/api/auth"; // Change port if needed

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${AUTH_API_BASE_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${AUTH_API_BASE_URL}/register`, loginData);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};
