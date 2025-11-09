import buisnessImg from './assets/Business.png';


function Option3({ onClick }) {
    
    return (
        <img
            className="optionImage2"
            onClick={onClick}
            src={buisnessImg}
            alt="Option 3"
        />
    );
}

export default Option3;