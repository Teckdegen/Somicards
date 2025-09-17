import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card } from './ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card shadow-elevated border-0 p-8 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground leading-tight">
              SOMI CARDS
            </h1>
            <p className="text-muted-foreground text-sm">
              Premium blockchain-powered debit cards
            </p>
          </div>
          
          <div className="pt-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="w-full bg-gradient-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg shadow-glow hover:shadow-elevated transition-all duration-300 transform hover:scale-105"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="w-full bg-destructive text-destructive-foreground font-semibold py-4 px-6 rounded-lg transition-all duration-300"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <p className="text-success font-medium">
                            ✅ Wallet Connected
                          </p>
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="w-full bg-gradient-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg shadow-glow hover:shadow-elevated transition-all duration-300"
                          >
                            View Dashboard
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;