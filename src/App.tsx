import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Home from "@/pages/Home";
import ToolDirectory from "@/pages/ToolDirectory";
import Reservation from "@/pages/Reservation";
import BorrowRecords from "@/pages/BorrowRecords";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<ToolDirectory />} />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/records" element={<BorrowRecords />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
