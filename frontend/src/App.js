import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import Welcome from './Components/Welcome/Welcome';
import Administrator from './Components/Administrator/Administrator';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import Profile from './Components/Profile/Profile';
import EditProfile from './Components/EditProfile/EditProfile';
import Notifications from './Components/Notifications/Notifications';
import Settings from './Components/Settings/Settings';
import Feed from './Components/Feed/Feed';
import Network from './Components/Network/Network';
import Jobs from './Components/Jobs/Jobs';
import Applicants from './Components/Applicants/Applicants';
import Chat from './Components/Chat/Chat';
import { Helmet } from 'react-helmet';

function App() {
  return (
    <div className="App">
      <Helmet>
          <title>LinkedIn</title>
      </Helmet>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />}/>
          <Route path="/welcome" element={<Welcome/>} />
          <Route path="/administrator" element={<Administrator/>} />
          <Route path="/welcome/login" element={<Login />} />
          <Route path="/welcome/register" element={<Register />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/edit-profile/:userId" element={<EditProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/network" element={<Network />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
