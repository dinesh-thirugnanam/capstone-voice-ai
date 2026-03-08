type TableMessage = {
    id: string;
    role: "assistant";
    type: "table";
    columns: string[];
    rows: string[][];
};

export default TableMessage;
