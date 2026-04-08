export default function Table({
    headers,
    children,
}: {
    headers: string[];
    children: React.ReactNode;
}) {
    return (
        <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
                <tr className="text-left text-gray-700">
                    {headers.map((h) => (
                        <th key={h} className="px-4 py-2 font-semibold">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>{children}</tbody>
        </table>
    );
}
