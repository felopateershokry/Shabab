import React from "react";
import "./SearchBar.css";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="ابحث عن المخدوم بالاسم أو رقم الهوية..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <span className="clear-search" onClick={() => setSearchTerm("")}>
          ✕
        </span>
      )}
    </div>
  );
};

export default SearchBar;
