import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
import './Home.css'
import Navbar from './../components/Navbar';

function Home() {
    return (
      <>
        <Navbar />
        <div className="home">
          <h1 className="title"> اجتماع سان جيوفاني للشباب </h1>
          <h2 className="subtitle"> كنيسة الشهيد ابانوب النهيسي بالمندرة </h2>
          <div className="home-image">
            <img src={assets.felo} alt="" />
          </div>
          <div className="btns">
            <Link to={"/list-khodam"}>
              <button className="home-button">الخدام</button>
            </Link>
            <Link to={"/list-makhdom"}>
              <button className="home-button">المخدومين</button>
            </Link>
          </div>
          <div className="scan-div">
            <Link to={"/scan"}>
              <button className='scan-btn'>مسح البطاقة</button>
            </Link>
          </div>
        </div>
      </>
    );
}

export default Home
