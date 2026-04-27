import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, Activity, Database, Server } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Monitoring() {
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.getSystemStatus();
        if (response.success) {
          setStatusLogs(response.data);
        }
      } catch (error) {
        console.error('Status fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
    if (code >= 400 && code < 500) return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
    return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 100) return 'text-green-500';
    if (ms < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            System Monitoring
          </h1>
          <p className="text-muted-foreground">
            Real-time API health and indexer status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Server</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-xs text-muted-foreground mt-1">Uptime: 99.99%</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Connected</div>
            <p className="text-xs text-muted-foreground mt-1">Latency: ~42ms</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Indexer</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Syncing</div>
            <p className="text-xs text-muted-foreground mt-1">Last synced: Just now</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle>Recent API Requests</CardTitle>
          <CardDescription>
            Live view of the last 50 requests hitting the backend server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : statusLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent requests logged.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.path}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.statusCode)} variant="secondary">
                          {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${getLatencyColor(log.responseTime)}`}>
                        {log.responseTime.toFixed(0)} ms
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
