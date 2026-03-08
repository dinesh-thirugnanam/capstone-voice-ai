import TableMessage from "@/types/TableMessage";
import React from "react";

type TableMessageProps = {
    message: TableMessage;
};

const TableMessageComp = ({ message }: TableMessageProps) => {
    return (
        <>
            <div className="overflow-x-auto drop-shadow-sm">
                <table className="border-separate border-spacing-2 bg-[#B3C1CE]/30 rounded-xl">
                    <thead className="bg-gray-100/50">
                        <tr>
                            {message.columns.map((item, i) => {
                                return (
                                    <th className="rounded-md" key={i}>
                                        {item}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {message.rows.map((row, i) => {
                            return (
                                <tr key={i}>
                                    {row.map((colData, j) => {
                                        return <td key={j}>{colData}</td>;
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TableMessageComp;
