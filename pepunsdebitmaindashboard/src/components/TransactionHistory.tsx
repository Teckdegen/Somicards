import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  tx_hash: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionHistory = ({ transactions, loading }: TransactionHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'pending':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <Card className="w-full p-6 bg-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Transaction History</span>
          </h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="w-full p-6 bg-card text-center">
        <div className="space-y-4 py-8">
          <div className="text-6xl">🐸</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-card-foreground">No Transactions Yet</h3>
            <p className="text-muted-foreground">
              Your transaction history will appear here after your first top-up
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full p-6 bg-card">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Transaction History</span>
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(transaction.status)}
                  <Badge variant={getStatusVariant(transaction.status)} className="capitalize">
                    {transaction.status}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="font-mono text-sm font-medium text-card-foreground">
                    +{formatAmount(transaction.amount)} SOM
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`${import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://explorer.somnia.network'}/tx/${transaction.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="font-mono">{truncateHash(transaction.tx_hash)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TransactionHistory;