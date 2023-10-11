const config = {
    REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV,
    REACT_APP_BASE_URL: process.env.REACT_APP_BASE_URL,
    REACT_APP_CHAT_BASE_URL: process.env.REACT_APP_CHAT_BASE_URL,
    REACT_APP_CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS,
    REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY: process.env.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY,
    REACT_APP_SECRET: process.env.REACT_APP_SECRET,
    rpcUrl: process.env.REACT_APP_NODE_ENV === "production"
        ? "https://rpc-mumbai.maticvigil.com"
        : "https://rpc-mumbai.maticvigil.com",
    networks: process.env.REACT_APP_NODE_ENV === "production"
        ? {
            // chainId : RPC URL
            80001: "https://matic-mumbai.chainstacklabs.com" //for polygon mainnet
        }
        : {
            // chainId : RPC URL
            80001: "https://matic-mumbai.chainstacklabs.com" //for polygon testnet
        }
};

export default config;
