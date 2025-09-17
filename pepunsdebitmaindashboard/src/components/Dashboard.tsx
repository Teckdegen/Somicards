import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { LogOut, Copy, User } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CONFIG, getTreasuryAddress, isBackendApiConfigured, getSomPrice, calculateSomAmount } from '@/lib/config';
import DebitCard from './DebitCard';
import TopUpForm from './TopUpForm';
import TransactionHistory from './TransactionHistory';

interface User {
  id: string;
  wallet_address: string;
  full_name: string;
  card_number?: string;
  expiry_date?: string;
  cvv?: string;
  billing_address?: string;
  balance: number;
}

interface Transaction {
  id: string;
  tx_hash: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

const Dashboard = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  
  // Transaction hooks
  const { sendTransaction, data: hash, isPending, error: sendError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTopUp, setPendingTopUp] = useState<{ amount: number; hash: string; usdAmount: number } | null>(null);

  useEffect(() => {
    if (address) {
      loadUserData();
    }
  }, [address]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash && pendingTopUp) {
      handleTransactionConfirmed(hash, pendingTopUp.amount, pendingTopUp.usdAmount);
    }
  }, [isConfirmed, hash, pendingTopUp]);

  // Handle transaction errors
  useEffect(() => {
    if (sendError) {
      console.error('Send transaction error:', sendError);
      toast({
        title: "Transaction Failed",
        description: sendError.message || "Transaction failed. Please try again.",
        variant: "destructive",
      });
      setPendingTopUp(null);
    }
  }, [sendError, toast]);

  const loadUserData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      console.log('Loading user data for wallet:', address);
      
      // Try a different approach - use maybeSingle() which handles 0 rows gracefully
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();

      console.log('Direct query result:', { userData, userError });

      if (userError) {
        console.error('User fetch error:', userError);
        toast({
          title: "Database Error",
          description: "Failed to access user data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!userData) {
        console.error('No user found for wallet:', address);
        toast({
          title: "User Not Found",
          description: "Wallet address not registered. Contact support.",
          variant: "destructive",
        });
        return;
      }

      setUser(userData);

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (transactionError) {
        console.error('Transactions fetch error:', transactionError);
      } else {
        setTransactions((transactionData || []) as Transaction[]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionConfirmed = async (txHash: string, amount: number, usdAmount: number) => {
    if (!user || !address) return;

    try {
      // Insert real transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          tx_hash: txHash,
          amount: amount,
          status: 'confirmed'
        });

      if (transactionError) {
        throw transactionError;
      }

      // Update user balance
      const newBalance = user.balance + amount;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (balanceError) {
        throw balanceError;
      }

      // Send Backend API notification
      await sendBackendNotification({
        name: user.full_name,
        amount: amount,
        usdAmount: usdAmount,
        wallet: address,
        txHash: txHash
      });

      // Refresh data
      await loadUserData();
      setPendingTopUp(null);
      
      toast({
        title: "Top-up Successful!",
        description: `Added $${usdAmount.toFixed(2)} (${amount.toLocaleString()} SOM) to your balance.`,
      });
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      toast({
        title: "Processing Error",
        description: "Transaction completed but processing failed. Contact support.",
        variant: "destructive",
      });
    }
  };

  const sendBackendNotification = async (data: {
    name: string;
    amount: number;
    usdAmount: number;
    wallet: string;
    txHash: string;
  }) => {
    // Check if Backend API is configured
    if (!isBackendApiConfigured()) {
      console.warn('⚠️  Backend API not configured. Skipping notification.');
      return;
    }

    try {
      const message = `🚀 New Top-up Transaction\n\n` +
        `👤 Name: ${data.name}\n` +
        `💰 Amount: $${data.usdAmount.toFixed(2)} (${data.amount.toLocaleString()} SOM)\n` +
        `🔗 Wallet: ${data.wallet}\n` +
        `📋 TX Hash: ${data.txHash}\n` +
        `⏰ Time: ${new Date().toLocaleString()}`;

      const response = await fetch(CONFIG.BACKEND_API.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CONFIG.BACKEND_API.NOTIFICATION_ID,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send backend notification');
      }

      console.log('✅ Backend notification sent successfully');
    } catch (error) {
      console.error('❌ Backend notification error:', error);
      // Don't throw - notification failure shouldn't break the flow
    }
  };

  const handleTopUp = async (usdAmount: number, somAmount: number) => {
    if (!user || !address) return;

    try {
      // SOM is the native gas token, so we send SOM directly (no conversion needed)
      const somAmountWei = parseEther(somAmount.toString());
      
      console.log(`🚀 Sending $${usdAmount} (${somAmount.toLocaleString()} SOM) to treasury`);
      
      // Send SOM transaction to treasury address
      sendTransaction({
        to: getTreasuryAddress(),
        value: somAmountWei,
      });
      
      // Store pending transaction info
      setPendingTopUp({ amount: somAmount, hash: '', usdAmount });
      
      toast({
        title: "Transaction Initiated",
        description: "Please confirm the transaction in your wallet.",
      });
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to initiate transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    setUser(null);
    setTransactions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-56 bg-muted rounded-lg max-w-md mx-auto"></div>
              <div className="h-64 bg-muted rounded-lg max-w-md mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-card rounded-lg shadow-elevated">
          <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground">
            Your wallet address is not registered. Please contact support.
          </p>
          <Button onClick={handleDisconnect} variant="outline">
            Disconnect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="min-h-screen bg-background/95 backdrop-blur-sm">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-6 h-6 text-primary" />
                  <div>
                    <h1 className="text-lg font-bold text-card-foreground">
                      {user.full_name}
                    </h1>
                    <button
                      onClick={() => copyToClipboard(address!)}
                      className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
                    >
                      <span className="font-mono">{truncateAddress(address!)}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Debit Card */}
          <section>
            <DebitCard
              cardNumber={user.card_number}
              expiryDate={user.expiry_date}
              cvv={user.cvv}
              billingAddress={user.billing_address}
              balance={user.balance}
              fullName={user.full_name}
              hasCard={!!user.card_number}
              walletAddress={address}
              onBalanceReload={loadUserData}
            />
          </section>

          {/* Top Up Form */}
          <section>
            <TopUpForm
              onTopUp={handleTopUp}
              isLoading={isPending || isConfirming}
            />
          </section>

          {/* Transaction History */}
          <section>
            <TransactionHistory
              transactions={transactions}
              loading={false}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
