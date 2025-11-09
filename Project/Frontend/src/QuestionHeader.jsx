function QuestionHeader({children}) {
    return (
        <h1 style={{
            textAlign: "center",
            fontSize: "35px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "40px",
            fontFamily: "Arial, sans-serif",
            letterSpacing: "-.5px",
            lineHeight: "1.2",
        }}>
            {children}
        </h1>
    );
}
export default QuestionHeader;