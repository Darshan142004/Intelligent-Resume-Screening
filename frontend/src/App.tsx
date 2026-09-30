import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';

// Recruiter Components & Pages
import { RecruiterLayout } from './components/RecruiterLayout';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { JobList } from './pages/recruiter/JobList';
import { CreateJob } from './pages/recruiter/CreateJob';
import { UploadResumes } from './pages/recruiter/UploadResumes';
import { CandidateList } from './pages/recruiter/CandidateList';
import { CandidateRanking } from './pages/recruiter/CandidateRanking';
import { RecruiterReports } from './pages/recruiter/RecruiterReports';

// Candidate Components & Pages
import { CandidateLayout } from './components/CandidateLayout';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfile } from './pages/candidate/CandidateProfile';
import { UploadResume } from './pages/candidate/UploadResume';
import { Recommendations } from './pages/candidate/Recommendations';
import { SkillGapAnalysis } from './pages/candidate/SkillGapAnalysis';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* Home Route */}
            <Route path="/" element={<Home />} />

            {/* Recruiter Routes */}
            <Route path="/recruiter" element={<RecruiterLayout />}>
              <Route index element={<RecruiterDashboard />} />
              <Route path="jobs" element={<JobList />} />
              <Route path="jobs/create" element={<CreateJob />} />
              <Route path="upload" element={<UploadResumes />} />
              <Route path="candidates" element={<CandidateList />} />
              <Route path="ranking" element={<CandidateRanking />} />
              <Route path="reports" element={<RecruiterReports />} />
            </Route>

            {/* Candidate Routes */}
            <Route path="/candidate" element={<CandidateLayout />}>
              <Route index element={<CandidateDashboard />} />
              <Route path="profile" element={<CandidateProfile />} />
              <Route path="upload" element={<UploadResume />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="skill-gap" element={<SkillGapAnalysis />} />
            </Route>
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
