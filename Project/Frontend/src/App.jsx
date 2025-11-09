import Option1 from "./Option1";
import Option2 from "./Option2";
import Option3 from "./Option3";
import Option4 from "./Option4";
import Option5 from "./Option5";
import Option6 from "./Option6";
import Dropdown from "./Dropdown Menu/dropdown";
import "./App.css";
import QuestionHeader from "./QuestionHeader";
import React, { useState } from "react";

function App() {
  const [screen, setScreen] = useState("home");
  const [firstDropdownSelected, setFirstDropdownSelected] = useState(false);
  const [secondDropdownSelected, setSecondDropdownSelected] = useState(false);

  const b1 = false;
  const b2 = false;
  const b3 = false;
  const b4 = false;
  const b5 = false;
  const b6 = false;
  const b7 = false;
  const b8 = false;
  const b9 = false;
  const b10 = false;
  const b11 = false;
  const b12 = false;

  // Define dropdown options
  const firstDropdownOptions = ["College 1", "College 2", "College 3"];
  const secondDropdownOptions = ["Major 1", "Major 2", "Major 3"];

  return (
    <div>
      {screen === "home" && (
        <div className="screen-container">
          <QuestionHeader>
            <center>
              <b>Select your college</b>
            </center>
          </QuestionHeader>

          <div style={{
            margin: "20px 0",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            gap: "30px"
          }}>
            {/* Dropdown */}
            <div style={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
              <Dropdown
                options={firstDropdownOptions}
                onSelect={(option) => {
                  setFirstDropdownSelected(true);             
                }}
              />
            </div>
            {firstDropdownSelected && (
              <div style={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
                <Dropdown
                  options={secondDropdownOptions}
                  onSelect={(option) => {
                    setSecondDropdownSelected(option);
                    setScreen("screen1")
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {screen === "screen1" && (
        <div className="screen-container">
          <QuestionHeader>
            <center>
              <b>Primary interest?</b>
            </center>
          </QuestionHeader>
          <Option1 onClick={() => setScreen("screen2")} handleClick={() => b1 == true} />
          <Option2 onClick={() => setScreen("screen2")} handleClick={() => b2 == true} />
          <Option3 onClick={() => setScreen("screen2")} handleClick={() => b3 == true} />
        </div>
      )}

      {screen === "screen2" && (
        <div className="screen-container">
          <QuestionHeader>
            <center>
              <b>Academic Interest</b>
            </center>
          </QuestionHeader>
          <div className="options-container">
          <Option4 onClick={() => setScreen("screen3")} handleClick={() => b4 == true} />
          <Option5 onClick={() => setScreen("screen3")} handleClick={() => b5 == true} />
          <Option6 onClick={() => setScreen("screen3")} handleClick={() => b6 == true} />
        </div>
        </div>
      )}

      {screen === "screen3" && (
        <div className="screen-container">
          <QuestionHeader>
            <center>
              <b>Next Question</b>
            </center>
          </QuestionHeader>
          <div className="options-container">
          <Option4 onClick={() => setScreen("screen4")} handleClick={() => b7 == true} />
          <Option5 onClick={() => setScreen("screen4")} handleClick={() => b8 == true} />
          <Option6 onClick={() => setScreen("screen4")} handleClick={() => b9 == true} />
        </div>
        </div>
      )}

      {screen === "screen4" && (
        <div className="screen-container">
          <QuestionHeader>
            <center>
              <b>Final Question</b>
            </center>
          </QuestionHeader>
          <div className="options-container">
          <Option4 onClick={() => setScreen("tinder")} handleClick={() => b10 == true} />
          <Option5 onClick={() => setScreen("tinder")} handleClick={() => b11 == true} />
          <Option6 onClick={() => setScreen("tinder")} handleClick={() => b12 == true} />
        </div>
        </div>
      )}

      {screen === "tinder" && <div>{/* Tinder screen content */}</div>}
    </div>
  );
}

export default App;