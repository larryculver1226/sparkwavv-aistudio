import esbuild from 'esbuild';

const code = `
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
console.log(firebaseApiKey);
`;

const res = await esbuild.transform(code, {
  define: {
    'import.meta.env': JSON.stringify({ VITE_FIREBASE_API_KEY: "AIzaTest" })
  }
});
console.log(res.code);
