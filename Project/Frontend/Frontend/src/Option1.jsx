import historyImg from './assets/History.png';

function Option1({ onClick }) {
  return (
    <img
      className="optionImage"
      onClick={onClick}
      src={historyImg}
      alt="Option 1"
    />
  );
}

export default Option1;