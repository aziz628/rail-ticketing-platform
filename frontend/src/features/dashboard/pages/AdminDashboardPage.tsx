import { Download, TrendingUp, Ticket, WalletCards, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useDashboardStats, useExportTransactions } from '../api/use-dashboard';


// return a formatted string with 2 decimal places and a space as thousand separator
const moneyFormatter = new Intl.NumberFormat('fr-TN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const { data, isLoading } = useDashboardStats();
  const exportTransactions = useExportTransactions();

  // Handle export button click
  const handleExport = async () => {
    const blob = await exportTransactions.mutateAsync();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!user) return null;

  // Prepare data for the chart
  const dailyTicketsSold = data?.dailyTicketsSold ?? [];

  

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content-wide sncft-page-section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* header */}
          <div className="sncft-page-header">
            <h1 className="sncft-page-title">Tableau de bord</h1>
            <p className="sncft-page-subtitle">Vue d'ensemble de l'activité administrative en temps réel.</p>
          </div>
        {/*export button */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportTransactions.isPending}
            className="gap-2 border-slate-200 text-slate-700 hover:bg-primary hover:text-white hover:border-primary"
          >
            <Download className="h-4 w-4" />
            {exportTransactions.isPending ? 'Préparation...' : 'Exporter les transactions'}
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading 
          ? (
            <div className="h-40 flex items-center justify-center">
              <RotatingLoader label="Chargement du tableau de bord..." />
            </div>
          ) 
          : ( 
            <div className="grid gap-4 md:grid-cols-3">
              { // stats cards 
              [
                {
                label: 'Billets vendus aujourd\'hui',
                value: data?.ticketsSoldToday ?? 0,
                icon: Ticket,
                },
                {
                label: 'Revenu total',
                value: `${moneyFormatter.format(Number(data?.totalRevenue ?? 0))} DT`,
                icon: WalletCards,
                },
                {
                label: 'Abonnements actifs',
                value: data?.activeSubscriptions ?? 0,
                icon: Users,
                },
               ].map((item) => (
                <Card key={item.label} className="sncft-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
                ))}
            </div>
          )}
        </div>
        
        {/* line graph */}
        <Card className="sncft-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="sncft-heading-lg">Nombre de Billets sur 30 jours</h2>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>

          {isLoading ? 
          <div className="h-40 flex items-center justify-center">
              <RotatingLoader label="Chargement du graph..." />
         </div> 
          : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/20">
              {/*  Shadcn wrapper that manages theme colors  for the chart */}
              <ChartContainer config={{ count: { label: "Billets",color: "#0b2e6a"} }} 
                              className="w-full h-[300px]">
                <AreaChart
                  accessibilityLayer
                  data={dailyTicketsSold}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  {/*  SVG definitions for the gradient fill used under the area curve */}
                  <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* Horizontal dashed lines for better readability of values */}
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  {/* Shows dates ,configured to show only every 5th label to avoid clutter */}
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: string, index) => {
                      return index % 5 === 0 || index === dailyTicketsSold.length - 1 ? value.slice(5) : '';
                    }}
                  />
                  {/* YAxis: Shows counts - allowDecimals={false} prevents non-integer labels like 1.5 */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  {/* ChartTooltip: Custom Shadcn tooltip that displays data on hover */}
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  {/* Area: The main visual representation - monotone curve with gradient fill and no dots */}
                  <Area
                    dataKey="count"
                    type="monotone"
                    fill="url(#fillCount)" // it references with "id" attribute the linearGradient defined in defs to create the gradient fill under the curve
                    stroke="var(--color-count)" // stroke is the color of the line
                    strokeWidth={2}
                    dot={true}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </Card>
      </div>
    </PrivateLayout>
  );
};