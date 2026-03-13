import React from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ListPage from './pages/ListPage'
import SinglePage from './pages/SinglePage'
import List5odam from './pages/List5odam';
import Single5odam from './pages/Single5odam'
import AddMakhdom from './pages/AddMakhdom';
import AddPage from './pages/AddPage';
import TodayAttendance from './pages/TodayAttendance'
import MostAttendance from './pages/MostAttendance'
import MonthAttendance from './pages/MonthAttendance'
import ScanAttendance from './pages/ScanAttendance'
import SearchByDate from './pages/SearchByDate';
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list-makhdom" element={<ListPage />} />
        <Route path="/add-makhdom" element={<AddMakhdom />} />
        <Route path="/edit-makhdom/:id" element={<AddMakhdom />} />
        <Route path="/list-khodam" element={<List5odam />} />
        <Route path="/add-khodam" element={<AddPage />} />
        <Route path="/edit-khodam/:id" element={<AddPage />} />
        <Route path="/single-makhdom/:id" element={<SinglePage />} />
        <Route path="/single-khodam/:id" element={<Single5odam />} />
        <Route path="/today-attendance" element={<TodayAttendance />} />
        <Route path="/most-attendance" element={<MostAttendance />} />
        <Route path="/month-attendance" element={<MonthAttendance />} />
        <Route path="/scan" element={<ScanAttendance />} />
        <Route path="/search-by-date" element={<SearchByDate />} />
      </Routes>
    </>
  );
}

export default App
