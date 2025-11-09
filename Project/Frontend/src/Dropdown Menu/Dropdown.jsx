import "./Dropdown.css";
import { useState } from "react";

function Dropdown({ options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const selectItem = (option) => {
    setSelected(option);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className="dropdown">
      <div 
        className={`dropdown-toggle ${isOpen ? "open" : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? selected : "Select an option"}
        <span className="arrow"></span>
      </div>
      {isOpen && (
        <ul className="dropdown-menu">
          {options.map((option, index) => (
            <li 
              key={index} 
              className="dropdown-item" 
              onClick={() => selectItem(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
