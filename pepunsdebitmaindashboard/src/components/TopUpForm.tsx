import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, TrendingUp, Info, DollarSign, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CONFIG, getSomPrice, calculateSomAmount } from '@/lib/config';

interface TopUpFormProps {
  onTopUp: (usdAmount: number, somAmount: number) => Promise<void>;
  isLoading: boolean;
}

const TopUpForm = ({ onTopUp, isLoading }: TopUpFormProps) => {
  const [selectedUsdAmount, setSelectedUsdAmount] = useState<number | null>(null);
  const [somPrice, setSomPrice] = useState<number>(0.01);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const USD_AMOUNTS = CONFIG.TOP_UP.USD_AMOUNTS;

  // Fetch SOM price on component mount
  useEffect(() => {
    const fetchSomPrice = async () => {
      try {
        setLoadingPrice(true);
        const price = await getSomPrice();
        setSomPrice(price);
      } catch (err) {
        console.error('Failed to fetch SOM price:', err);
        toast({
          title: "Price fetch failed",
          description: "Using fallback price. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchSomPrice();
    
    // Refresh price every 60 seconds
    const interval = setInterval(fetchSomPrice, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleAmountSelect = (usdAmount: number) => {
    setSelectedUsdAmount(usdAmount);
    setError('');
  };

  const calculateSomAmountForUsd = (usdAmount: number) => {
    return calculateSomAmount(usdAmount, somPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUsdAmount) {
      setError('Please select an amount');
      return;
    }

    if (loadingPrice || somPrice <= 0) {
      setError('Price data unavailable. Please wait and try again.');
      return;
    }

    try {
      const somAmount = calculateSomAmountForUsd(selectedUsdAmount);
      await onTopUp(selectedUsdAmount, somAmount);
      setSelectedUsdAmount(null);
      setError('');
      toast({
        title: "Top-up initiated",
        description: "Your transaction is being processed...",
      });
    } catch (err) {
      toast({
        title: "Transaction failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const refreshPrice = async () => {
    try {
      setLoadingPrice(true);
      const price = await getSomPrice();
      setSomPrice(price);
      toast({
        title: "Price updated",
        description: `Current SOM price: $${price.toFixed(6)}`,
      });
    } catch (err) {
      toast({
        title: "Price update failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoadingPrice(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-card shadow-elevated">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Top Up SOM</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add funds to your debit card balance
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <Coins className="w-4 h-4" />
            <span>
              Current SOM Price: ${loadingPrice ? 'Loading...' : somPrice.toFixed(6)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPrice}
              disabled={loadingPrice}
              className="h-auto p-1 text-xs"
            >
              {loadingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Amount (USD)
            </Label>
            
            {/* USD Amount Selection */}
            <div className="grid grid-cols-2 gap-3">
              {USD_AMOUNTS.map((usdAmount) => {
                const somAmount = calculateSomAmountForUsd(usdAmount);
                const isSelected = selectedUsdAmount === usdAmount;
                
                return (
                  <button
                    key={usdAmount}
                    type="button"
                    onClick={() => handleAmountSelect(usdAmount)}
                    disabled={loadingPrice}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    } ${loadingPrice ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-lg font-bold">{usdAmount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {loadingPrice ? 'Loading...' : `≈ ${somAmount.toLocaleString()} SOM`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          {/* Selected Amount Summary */}
          {selectedUsdAmount && !loadingPrice && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD Amount:</span>
                <span className="font-mono">${selectedUsdAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SOM Amount:</span>
                <span className="font-mono">{calculateSomAmountForUsd(selectedUsdAmount).toLocaleString()} SOM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SOM Price:</span>
                <span className="font-mono text-green-600">${somPrice.toFixed(6)}</span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-blue-800 font-medium">Important Information:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Prices are fetched from CoinGecko and update every 60 seconds</li>
                  <li>• Balance updates may take a few minutes to reflect</li>
                  <li>• Your funds are secure and protected during processing</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!!error || !selectedUsdAmount || isLoading || loadingPrice}
            className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 shadow-glow hover:shadow-elevated transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : loadingPrice ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Price...
              </>
            ) : (
              `Top Up $${selectedUsdAmount || 0}`
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default TopUpForm;
