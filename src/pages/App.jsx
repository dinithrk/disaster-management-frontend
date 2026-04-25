import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SitePage from './pages/SitePage';
import SensorPage from './pages/SensorPage';
import SensorTypePage from './pages/SensorTypePage';

function App() {
    return (
        <Router>
            <nav style={{ padding: '10px', background: '#f0f0f0' }}>
                <Link to="/">Sites</Link> | <Link to="/sensors">Sensors</Link> | <Link to="/types">Types</Link>
            </nav>

            <Routes>
                <Route path="/" element={<SitePage />} />
                <Route path="/sensors" element={<SensorPage />} />
                <Route path="/types" element={<SensorTypePage />} />
            </Routes>
        </Router>
    );
}