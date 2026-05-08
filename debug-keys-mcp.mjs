
import dotenv from "dotenv";
dotenv.config();

const getApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
    process.env.GENAI_API_KEY
  ].filter(Boolean);
  
  console.log(`Detected ${keys.length} potential keys in environment.`);
  
  const validKeys = keys.filter(k => 
    k &&
    k.length > 5 && 
    !k.startsWith('{{') && 
    !k.endsWith('}}') &&
    k !== 'undefined'
  );

  console.log(`Found ${validKeys.length} valid keys after filtering.`);
  return [...new Set(validKeys)];
};

const keys = getApiKeys();
keys.forEach((k, i) => {
    console.log(`Key ${i}: ${k.substring(0, 4)}...${k.substring(k.length - 4)}`);
});
