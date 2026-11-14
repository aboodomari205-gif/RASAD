import app from './app.js';
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`FIREPULSE API running on http://localhost:${port}`));
