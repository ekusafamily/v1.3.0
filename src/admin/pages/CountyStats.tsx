
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CountyStat {
    county: string;
    count: number;
}

const CountyStats = () => {
    const [stats, setStats] = useState<CountyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/county-stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Prepare data for chart (filtering out 0s for cleaner chart, or keeping top 10)
    const chartData = stats.slice(0, 15);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">County Statistics</h2>
                    <p className="text-muted-foreground">Member distribution by county.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Distribution Overview (Top 15)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="county" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" name="Members" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed County Data</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center">Loading stats...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>County</TableHead>
                                    <TableHead>Member Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((stat, index) => (
                                    <TableRow key={stat.county}>
                                        <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                                        <TableCell className="font-semibold">{stat.county}</TableCell>
                                        <TableCell>
                                            <Badge variant={stat.count > 0 ? "default" : "secondary"}>
                                                {stat.count}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CountyStats;
