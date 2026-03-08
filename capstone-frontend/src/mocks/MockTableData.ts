import TableMessage from "../../../shared/types/TableMessage";

const MockTableData: TableMessage = {
    id: "msg-001",
    role: "assistant",
    type: "table",
    columns: ["Name", "Role", "Location", "Status"],
    rows: [
        ["Alice Johnson", "Frontend Developer", "Bangalore", "Active"],
        ["Rahul Sharma", "Backend Developer", "Delhi", "Active"],
        ["Maria Garcia", "Product Manager", "Madrid", "Inactive"],
        ["Ken Tanaka", "UI Designer", "Tokyo", "Active"],
    ],
};

export default MockTableData;
