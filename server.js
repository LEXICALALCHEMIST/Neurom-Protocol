import express from 'express';
import cors from 'cors';
import authRouter from './api/auth.js';
import morphRouter from './api/morph.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRouter);
app.use('/morph', morphRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});