import Web3 from "web3";
import { SiweMessage } from "siwe";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import {
  Row,
  Col,
  Button,
} from "reactstrap";
import { BottomSheet } from "react-spring-bottom-sheet"
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import membershipWithExpiryABI from "../../contracts_abi/membershipExpiry.json";
import config from "../../config";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

const wc = new WalletConnect();

class ConnectWalletPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      showSheet: false,
      walletConnect: false,
      connector: "",
      web3: "",
      account: "",
      fromPage: this.props.location.state ? this.props.location.state.fromPage : ""
    };
  }

  checkIfDataStoredOnBlockchain = async (web3, walletAddress) => {
    const membershipWithExpiry = GeneralFunctions.getMembershipWithExpiry();
    const contractAddress = membershipWithExpiry
      ? config.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY
      : config.REACT_APP_CONTRACT_ADDRESS;
    const membershipABI_JSON = membershipWithExpiry
      ? membershipWithExpiryABI
      : membershipABI;
    const myContract = await new web3.eth.Contract(membershipABI_JSON, contractAddress);
    try {
      let tokenId = localStorage.getItem("tokenId");
      if (!tokenId) {
        let response = await Server.request({
          url: `/user/getTokenId?walletAddress=${walletAddress}`,
          method: "GET"
        });
        if (response.success && response.tokenId) {
          tokenId = response.tokenId;
        } else {
          tokenId = 1;
        }
      }
      const response = await myContract.methods
        .ownerOf(tokenId)
        .call();
      if (response && response === walletAddress) {
        this.props.history.push(
          `/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`
        );
      } else {
        this.props.history.push({
          pathname: "/profile-page",
          state: {
            walletAddress
          }
        });
      }
    } catch (error) {
      let message = error.message || error.Error;
      if (message.toLowerCase().includes("invalid token id")) {
        this.props.history.push({
          pathname: "/profile-page",
          state: {
            walletAddress
          }
        });
      } else {
        this.notificationSystem.addNotification({
          message,
          level: "error",
        });
      }
    }
  }

  authenticateForSignUpPage = async () => {
    try {
      this.setState({ showLoader: true, showSheet: false });
      const signIn = localStorage.getItem("signIn");
      if (signIn) {
        const walletAddress = localStorage.getItem("walletAddress");
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let provider;
        if (isMobileDevice || this.state.walletConnect) {
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: { [this.state.connector.chainId]: await config.networks[this.state.connector.chainId] }
          });
          await walletConnectProvider.enable();
          provider = walletConnectProvider;
        } else {
          provider = Web3.givenProvider;
        }
        const web3 = new Web3(provider);
        this.checkIfDataStoredOnBlockchain(web3, walletAddress);
      } else {
        let response = await Server.request({
          url: "/getSignMessage",
          method: "GET"
        });
        const message = response.messageToSign;
        if (!message) {
          throw new Error("Invalid message to sign");
        }
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let signature; let messageToSign; let web3; let chainId;
        if (isMobileDevice || this.state.walletConnect) {
          chainId = this.state.connector.chainId;
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: { [chainId]: await config.networks[chainId] }
          });
          await walletConnectProvider.enable();
          web3 = new Web3(walletConnectProvider);
          const account = this.state.connector.accounts.length ? this.state.connector.accounts[0] : null;
          if (account) {
            const siwe = new SiweMessage({
              domain: window.location.hostname,
              uri: window.location.origin,
              address: account,
              chainId,
              version: "1",
              statement: message,
              nonce: await GeneralFunctions.getUid(16, "alphaNumeric"),
            });
            messageToSign = siwe.prepareMessage();
            try {
              signature = await this.state.connector.signPersonalMessage([account, messageToSign]);
            } catch (error) {
              throw (new Error(error.message || error));
            }
          }
        } else {
          web3 = this.state.web3;
          chainId = await web3.eth.getChainId();
          const siwe = new SiweMessage({
            domain: window.location.hostname,
            uri: window.location.origin,
            address: this.state.account,
            chainId,
            version: "1",
            statement: message,
            nonce: await GeneralFunctions.getUid(16, "alphaNumeric"),
          });
          messageToSign = siwe.prepareMessage();
          signature = await web3.eth.personal.sign(messageToSign, this.state.account);
        }
        let signatureVerified = await Server.request({
          url: "/web3Auth/connectWallet",
          method: "POST",
          data: {
            messageToSign,
            signature,
            walletAddress: this.state.account
          }
        });
        if (signatureVerified.success) {
          localStorage.setItem("signIn", true);
          localStorage.setItem("chainId", chainId);
          localStorage.setItem("walletAddress", signatureVerified.walletAddress);
          this.checkIfDataStoredOnBlockchain(web3, signatureVerified.walletAddress);
        } else {
          throw Error(signatureVerified.message);
        }
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  authenticateForLoginPage = async () => {
    try {
      this.setState({ showLoader: true, showSheet: false });
      const signIn = localStorage.getItem("signIn");
      if (signIn) {
        Server.sendDataToMobileApp(JSON.stringify({ message: 'Logged in Successfully' }));
      } else {
        let response = await Server.request({
          url: "/web3Auth/getSignMessage",
          method: "GET"
        });
        const message = response.messageToSign;
        if (!message) {
          throw new Error("Invalid message to sign");
        }
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let signature; let messageToSign; let chainId;
        if (isMobileDevice || this.state.walletConnect) {
          chainId = this.state.connector.chainId;
          const account = this.state.connector.accounts.length ? this.state.connector.accounts[0] : null;
          if (account) {
            const siwe = new SiweMessage({
              domain: window.location.hostname,
              uri: window.location.origin,
              address: account,
              chainId,
              version: "1",
              statement: message,
              nonce: await GeneralFunctions.getUid(16, "alphaNumeric"),
            });
            messageToSign = siwe.prepareMessage();
            try {
              signature = await this.state.connector.signPersonalMessage([account, messageToSign]);
            } catch (error) {
              throw (new Error(error.message || error));
            }
          }
        } else {
          let web3 = this.state.web3;
          chainId = await web3.eth.getChainId();
          const siwe = new SiweMessage({
            domain: window.location.hostname,
            uri: window.location.origin,
            address: this.state.account,
            chainId,
            version: "1",
            statement: message,
            nonce: await GeneralFunctions.getUid(16, "alphaNumeric"),
          });
          messageToSign = siwe.prepareMessage();
          signature = await web3.eth.personal.sign(messageToSign, this.state.account);
        }
        let signatureVerified = await Server.request({
          url: "/web3Auth/verifySignMessage",
          method: "POST",
          data: {
            messageToSign,
            signature,
            walletAddress: this.state.account
          }
        });
        if (signatureVerified.success) {
          localStorage.setItem("signIn", true);
          localStorage.setItem("chainId", chainId);
          localStorage.setItem("tokenId", signatureVerified.user.tokenId);
          localStorage.setItem("accessToken", signatureVerified.accessToken);
          localStorage.setItem("walletAddress", signatureVerified.walletAddress);
          Object.assign(signatureVerified, { signupMethod: "web3" });
          Server.sendDataToMobileApp(JSON.stringify(signatureVerified));
        } else {
          throw Error(signatureVerified.message);
        }
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  connectWallet = async (walletConnect) => {
    let details = navigator.userAgent;
    let regexp = /android|iphone|kindle|ipad/i;
    let isMobileDevice = regexp.test(details);
    if (isMobileDevice || walletConnect) {
      const connector = await wc.connect();
      this.setState({ walletConnect, connector, showWalletConnectModal: false })
    } else {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      let web3 = new Web3(Web3.givenProvider);
      const account = Web3.utils.toChecksumAddress(accounts[0]);
      this.setState({ walletConnect, web3, account, showWalletConnectModal: false });
    }
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        this.setState({ showSheet: true })
        clearTimeout();
        resolve();
      }, 1000);
    })
  }

  onDismiss = () => {
    this.setState({ showSheet: false });
  }

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <div
              style={{
                flexDirection: "column",
                display: "flex",
                marginTop: 20,
              }}
            >
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col
                  xs="12"
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Row
                    style={{
                      justifyContent: "flex-start",
                      alignItems: "center",
                      margin: "0px 15px"
                    }}
                  >
                    <h3 style={{ color: "gray", margin: 0 }}>Connect a wallet</h3>
                  </Row>
                  <Row
                    style={{
                      justifyContent: "flex-start",
                      alignItems: "center",
                      margin: "10px 15px"
                    }}
                  >
                    <h5 style={{ color: "gray", margin: 0, fontSize: "15px", fontWeight: 600 }}>Recommended</h5>
                  </Row>
                  <Row
                    style={{
                      marginBottom: "5px",
                      padding: "15px",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "rgb(245, 246, 252)",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px"
                    }}
                  >
                    <Button
                      onClick={() => this.connectWallet(false)}
                      style={{
                        width: "100%",
                        margin: 0,
                        padding: 0,
                        border: 0,
                        color: "black",
                        display: "flex",
                        alignItems: "center"
                      }}
                      color="info"
                      type="button"
                      size="lg"
                      outline
                    >
                      <img
                        style={{
                          width: "40px",
                          cursor: "pointer",
                          border: "1px solid rgb(210, 217, 238)",
                          borderRadius: "8px"
                        }}
                        alt="..."
                        src="metamask.png"
                      />
                      <label
                        style={{
                          cursor: "pointer",
                          marginLeft: "10px",
                          marginBottom: 0,
                          fontSize: "20px",
                          fontWeight: 600
                        }}
                      >
                        MetaMask
                      </label>
                    </Button>
                  </Row>
                  <Row
                    style={{
                      marginBottom: "5px",
                      padding: "15px",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "rgb(245, 246, 252)",
                      borderBottomLeftRadius: "10px",
                      borderBottomRightRadius: "10px"
                    }}
                  >
                    <Button
                      onClick={() => this.connectWallet(true)}
                      style={{
                        width: "100%",
                        margin: 0,
                        padding: 0,
                        border: 0,
                        color: "black",
                        display: "flex",
                        alignItems: "center"
                      }}
                      color="info"
                      type="button"
                      size="lg"
                      outline
                    >
                      <img
                        style={{
                          width: "40px",
                          cursor: "pointer",
                          border: "1px solid rgb(210, 217, 238)",
                          borderRadius: "8px"
                        }}
                        alt="..."
                        src="walletConnect.png"
                      />
                      <label
                        style={{
                          cursor: "pointer",
                          marginLeft: "10px",
                          marginBottom: 0,
                          fontSize: "20px",
                          fontWeight: 600
                        }}
                      >
                        WalletConnect
                      </label>
                    </Button>
                  </Row>
                </Col>
              </Row>
            </div>
        }
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
        <BottomSheet
          open={this.state.showSheet}
          snapPoints={({ minHeight }) => minHeight}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #17517b;
          }`}
          </style>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 15,
            }}
          >
            <img
              style={{ height: "40px", width: "40px", marginTop: "5px" }}
              alt="..."
              src="nusantaraWhite.png"
            ></img>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 20,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Verify your account
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 30px",
              marginTop: 30,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "14px",
              }}
            >
              To finish connecting, sign a message in your wallet to verify that
              you are the owner of this account
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Button
              style={{
                width: "60%",
                padding: "13px 0px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "black",
              }}
              onClick={this.state.fromPage === "loginPage"
                ? this.authenticateForLoginPage
                : this.authenticateForSignUpPage
              }
              className="btn-round"
              color="black"
              type="button"
              size="lg"
            >
              Send Message
            </Button>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              onClick={() => this.onDismiss()}
              style={{
                padding: "10px 29px",
                fontSize: "21px",
                fontWeight: "bold",
                color: "white",
              }}
              className="btn-round"
              color="info"
              type="button"
              size="lg"
              outline
            >
              <label
                style={{
                  cursor: "pointer",
                  float: "left",
                  marginBottom: "0px",
                }}
              >
                Cancel
              </label>
            </Button>
          </Row>
        </BottomSheet>
      </>
    );
  }
}

export default ConnectWalletPage;