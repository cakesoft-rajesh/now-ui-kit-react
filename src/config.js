const config = {
    REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV,
    REACT_APP_BASE_URL: process.env.REACT_APP_BASE_URL,
    REACT_APP_CHAT_BASE_URL: process.env.REACT_APP_CHAT_BASE_URL,
    REACT_APP_CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS,
    REACT_APP_SECRET: process.env.REACT_APP_SECRET,
    rpcUrl: process.env.REACT_APP_NODE_ENV === "production"
        ? "https://polygon-rpc.com"
        : "https://rpc-mumbai.maticvigil.com",
    networks: process.env.REACT_APP_NODE_ENV === "production"
        ? {
            // chainId : RPC URL
            80001: "https://polygon-rpc.com" //for polygon mainnet
        }
        : {
            // chainId : RPC URL
            80001: "https://rpc-mumbai.maticvigil.com" //for polygon testnet
        },
    sponserWalletAddress: process.env.REACT_APP_SPONSER_WALLET_ADDRESS,
    sponserPrivateKey: process.env.REACT_APP_SPONSER_PRIVATE_KEY
};

export default config;
