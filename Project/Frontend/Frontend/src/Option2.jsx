import stemImg from './assets/STEM.png';

function Option2({ onClick }) {
    return (
        <img
            className="optionImage1"
            onClick={onClick}
            src={stemImg}
            alt="Option 2"
        />
    );
}

export default Option2;