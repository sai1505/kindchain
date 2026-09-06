import ActClient from "./ActClient";

export default async function ActPage({
    params,
}: {
    params: Promise<{ needId: string }>;
}) {
    const { needId } = await params;

    return <ActClient needId={needId} />;
}