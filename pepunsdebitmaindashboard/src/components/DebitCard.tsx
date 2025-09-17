import { Card } from './ui/card';
import { Button } from './ui/button';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CONFIG } from '@/lib/config';

interface DebitCardProps {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  billingAddress?: string;
  balance: number;
  fullName: string;
  hasCard: boolean;
  walletAddress?: string;
  onBalanceReload?: () => void;
}

const DebitCard = ({ 
  cardNumber, 
  expiryDate, 
  cvv, 
  billingAddress, 
  balance, 
  fullName,
  hasCard,
  walletAddress,
  onBalanceReload
}: DebitCardProps) => {
  const [showSensitive, setShowSensitive] = useState(false);
  const { toast } = useToast();

  const formatCardNumber = (number?: string) => {
    if (!number) return '**** **** **** ****';
    if (showSensitive) return number.replace(/(.{4})/g, '$1 ').trim();
    return `**** **** **** ${number.slice(-4)}`;
  };

  const formatCVV = (cvv?: string) => {
    if (!cvv) return '***';
    return showSensitive ? cvv : '***';
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleBalanceReload = async () => {
    if (!walletAddress || !fullName) return;
    
    try {
      // Send Backend API notification
      const message = `🔄 Balance Reload Request\n\nName: ${fullName}\nWallet: ${walletAddress}`;
      
      await fetch(CONFIG.BACKEND_API.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CONFIG.BACKEND_API.NOTIFICATION_ID,
          text: message,
        }),
      });

      // Call the reload function if provided
      if (onBalanceReload) {
        onBalanceReload();
      }

      toast({
        title: "Balance Update",
        description: "Balance would be updated shortly.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (!hasCard) {
    return (
      <Card className="relative w-full max-w-md mx-auto h-56 bg-gradient-card border-2 border-dashed border-muted flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="text-6xl">🐸</div>
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium">
              Top up SOM to activate your card
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {formatBalance(balance)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-md mx-auto h-56 bg-gradient-primary text-primary-foreground shadow-elevated overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-primary-foreground/30"></div>
        <div className="absolute top-8 right-8 w-8 h-8 rounded-full border-2 border-primary-foreground/20"></div>
      </div>
      
      {/* Card Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs font-medium opacity-80">SOMI CARDS</h3>
            <p className="text-lg font-bold mt-1">{formatBalance(balance)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBalanceReload}
              size="sm"
              variant="default"
              className="h-9 px-4 text-sm bg-background text-foreground border-2 border-background hover:bg-accent hover:text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <RefreshCw size={16} className="mr-2" />
              Reload Balance
            </Button>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
            >
              {showSensitive ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Card Number */}
        <div className="space-y-4">
          <div 
            className="cursor-pointer group"
            onClick={() => cardNumber && copyToClipboard(cardNumber, 'Card number')}
          >
            <p className="text-xs opacity-60 mb-1">CARD NUMBER</p>
            <p className="text-lg font-mono tracking-wider group-hover:opacity-80 transition-opacity">
              {formatCardNumber(cardNumber)}
              {cardNumber && <Copy className="inline ml-2 w-4 h-4 opacity-60" />}
            </p>
          </div>

          {/* Bottom Row */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-60 mb-1">CARDHOLDER</p>
              <p className="text-sm font-medium uppercase">{fullName}</p>
            </div>
            
            <div className="text-right space-x-4 flex">
              <div>
                <p className="text-xs opacity-60 mb-1">EXPIRES</p>
                <p className="text-sm font-mono">{expiryDate || 'MM/YY'}</p>
              </div>
              
              <div 
                className="cursor-pointer group"
                onClick={() => cvv && copyToClipboard(cvv, 'CVV')}
              >
                <p className="text-xs opacity-60 mb-1">CVV</p>
                <p className="text-sm font-mono group-hover:opacity-80 transition-opacity">
                  {formatCVV(cvv)}
                  {cvv && <Copy className="inline ml-1 w-3 h-3 opacity-60" />}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DebitCard;