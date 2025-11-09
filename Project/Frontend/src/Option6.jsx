import Option3 from './assets/Option3.png';


function Option6({ onClick }) {
    
    return (
        <img
            className="optionImage2"
            onClick={onClick}
            src={Option3}
            alt="Option 3"
        />
    );
}

export default Option6;