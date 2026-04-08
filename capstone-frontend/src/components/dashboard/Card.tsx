export default function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>

            {children}
        </div>
    );
}
