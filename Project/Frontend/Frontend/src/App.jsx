import Option1 from "./Option1";
import Option2 from "./Option2";
import Option3 from "./Option3";
import Option4 from "./Option4";
import Option5 from "./Option5";
import Option6 from "./Option6";
import React, { useState } from "react";

function App() {
  const [screen, setScreen] = useState('home');
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

  return (
    <div>
      {screen === 'home' && (
        <div>
          <h1><center> <b>Primary interest? </b></center></h1>
          <Option1 onClick={() => setScreen('screen1')} handleClick = {() => b1 == true}/>
          <Option2 onClick={() => setScreen('screen1')} handleClick = {() => b2 == true}/>
          <Option3 onClick={() => setScreen('screen1')} handleClick = {() => b3 == true}/>
          
        </div>
      )}
   

      {screen === 'screen1' && (
        <div>
          <Option4 onClick={() => setScreen('screen2')} handleClick = {() => b4 == true} />
          <Option5 onClick={() => setScreen('screen2')} handleClick ={() => b5 == true} />
          <Option6 onClick={() => setScreen('screen2')} handleClick = {() => b6 == true} />
        </div>
      )}



      {screen === 'screen2' && (
        <div>
        <Option4 onClick={() => setScreen('screen3')} handleClick = {() => b7 == true} />
        <Option5 onClick={() => setScreen('screen3')} handleClick ={() => b8 == true} />
        <Option6 onClick={() => setScreen('screen3')} handleClick = {() => b9 == true} />
          
        </div>
      )}
      
      

      {screen === 'screen3' && (
        <div>
          <Option4 onClick={() => setScreen('tinder')} handleClick = {() => b10 == true} />
          <Option5 onClick={() => setScreen('tinder')} handleClick ={() => b11 == true} />
          <Option6 onClick={() => setScreen('tinder')} handleClick = {() => b12 == true} />
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
