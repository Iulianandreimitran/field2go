// src/lib/openai.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // pune cheia ta în .env.local
});

export default openai;
