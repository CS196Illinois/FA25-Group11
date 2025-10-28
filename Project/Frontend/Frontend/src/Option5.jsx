import Option2 from './assets/Option2.png';


function Option5({ onClick }) {
    
    return (
        <img
            className="optionImage1"
            onClick={onClick}
            src={Option2}
            alt="Option 2"
        />
    );
}

export default Option5;