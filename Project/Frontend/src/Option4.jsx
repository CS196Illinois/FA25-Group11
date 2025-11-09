import option1 from './assets/Untitled Drawing.png';


function Option4({ onClick }) {
    
    return (
        <img
            className="optionImage"
            onClick={onClick}
            src={option1}
            alt="option 1"
        />
    );
}

export default Option4;