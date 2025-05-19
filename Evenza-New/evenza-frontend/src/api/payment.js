import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

// Create Razorpay order
export const createPaymentOrder = async (amount) => {
  try {
    const response = await axios.post(`${BASE_URL}/payment/create-order`, {
      amount,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create payment order:", error);
    throw error;
  }
};
