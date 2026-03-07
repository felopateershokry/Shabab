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
          <h1 className="title"> خدمة شباب كنيسة ابانوب النهيسي </h1>
          {/* <h2 className='subtitle'>اسرة اولى ابتدائي</h2> */}
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
        </div>
      </>
    );
}

export default Home
