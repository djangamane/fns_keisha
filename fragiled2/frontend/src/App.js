import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import { matrixTheme } from './styles/theme';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import ArticleDetail from './components/ArticleDetail';
import MatrixBackground from './components/MatrixBackground';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={matrixTheme}>
      <GlobalStyles />
      <Router>
        <div className="App">
          <MatrixBackground />
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<NewsFeed />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
