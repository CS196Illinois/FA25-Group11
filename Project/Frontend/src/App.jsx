import Option1 from "./Option1";
import Option2 from "./Option2";
import Option3 from "./Option3";
import Option4 from "./Option4";
import Option5 from "./Option5";
import Option6 from "./Option6";
import React, { useState } from "react";

function App() {
  const [screen, setScreen] = useState('home');
  const map = {};
  const college = {};

  return (
    <div>
      {screen === 'Majors' && (
        <div>
        <Option4 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "BUS"} />
        <Option5 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "LAS"} />
        <Option6 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "LAW"} />
        <Option4 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "CIMED"} />
        <Option5 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "AHS"} />
        <Option6 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "ACES"} />
        <Option4 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "EDUC"} />
        <Option5 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "MEDIA"} />
        <Option6 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "GCOE"} />
        <Option4 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "SSW"} />
        <Option5 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "iSchool"} />
        <Option6 onClick={() => setScreen('Dropdown Menu')} handleClick = {() => college == "LER"} />
        </div>
      )}

      {screen === 'Minors' && (
        <div>
        <Option4 onClick={() => setScreen('Dropdown Menu')} />
        <Option5 onClick={() => setScreen('Dropdown Menu')} />
        <Option6 onClick={() => setScreen('Dropdown Menu')} />
        </div>
      )}

      {screen === 'Dropdown Menu' && (
        <div>
          
          
        </div>
      )}

      {screen === 'home' && (
        <div>
          <h1><center> <b>Primary interest? </b></center></h1>
          <Option1 onClick={() => setScreen('screen1')} handleClick = {() => map[1] == 1}/>
          <Option2 onClick={() => setScreen('screen1')} handleClick = {() => map[1] == 2}/>
          <Option3 onClick={() => setScreen('screen1')} handleClick = {() => map[1] == 3}/>
          
        </div>
      )}
   

      {screen === 'screen1' && (
        <div>
          <Option4 onClick={() => setScreen('screen2')} handleClick = {() => map[2] == 1} />
          <Option5 onClick={() => setScreen('screen2')} handleClick ={() => map[2] == 2} />
          <Option6 onClick={() => setScreen('screen2')} handleClick = {() => map[2] == 3} />
        </div>
      )}



      {screen === 'screen2' && (
        <div>
        <Option4 onClick={() => setScreen('screen3')} handleClick = {() => map[3] == 1} />
        <Option5 onClick={() => setScreen('screen3')} handleClick ={() => map[3] == 2} />
        <Option6 onClick={() => setScreen('screen3')} handleClick = {() => map[3] == 3} />
          
        </div>
      )}
      
      

      {screen === 'screen3' && (
        <div>
          <Option4 onClick={() => setScreen('tinder')} handleClick = {() => map[4] == 1} />
          <Option5 onClick={() => setScreen('tinder')} handleClick ={() => map[4] == 2} />
          <Option6 onClick={() => setScreen('tinder')} handleClick = {() => map[4] == 3} />
        </div>
      )}
    

      {screen === 'tinder' && (
        <div>
        </div>
      )}
    </div>
  );
}

export default App;
