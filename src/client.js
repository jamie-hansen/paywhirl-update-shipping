import axios from 'axios';

const API_BASE = 'https://api.shop.paywhirl.com/2022-04';

export const pw = axios.create({
  baseURL: API_BASE,
});

export function applyAuth() {
  const token = process.env.PAYWHIRL_API_TOKEN;
  if (!token) {
    console.error('Error: PAYWHIRL_API_TOKEN is not set in environment variables.');
    process.exit(1);
  }
  pw.defaults.headers.common['X-Api-Token'] = token;
}

export async function getSubscription(id) {
  try {
    const response = await pw.get(`/subscriptions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch subscription ${id}: ${error.response?.data?.message || error.message}`);
  }
}

export async function updateDeliveryPrice(id, deliveryPrice) {
  try {
    const response = await pw.put(`/subscriptions/${id}`, { deliveryPrice });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update subscription ${id}: ${error.response?.data?.message || error.message}`);
  }
}