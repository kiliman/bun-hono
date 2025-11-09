import { BrowserRouter, Routes, Route } from 'react-router-dom';
import About from './routes/About';
import Books from './routes/Books';
import NotFound from './routes/NotFound';
import TestApi from './routes/TestApi';
import _Layout from './_Layout';
import Home from './routes/Home';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<_Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/books" element={<Books />} />
          <Route path="/test-api" element={<TestApi />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

