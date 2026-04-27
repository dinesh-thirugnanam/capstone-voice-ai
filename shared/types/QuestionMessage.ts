type QuestionMessage = {
    id: string;
    role: "user" | "assistant";
    type: "question";
    status: "done";
    content: string; // The question text
};

export default QuestionMessage;
