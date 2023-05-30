import Web3 from 'web3';
import { SiweMessage } from 'siwe';
import { Link } from "react-router-dom";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
} from "reactstrap";
import { BottomSheet } from 'react-spring-bottom-sheet'
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import membershipWithExpiryABI from "../../contracts_abi/membershipExpiry.json";
import * as Server from "../../utils/Server";
import * as NetworkData from 'utils/networks';
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import 'react-spring-bottom-sheet/dist/style.css'

const wc = new WalletConnect();

class LoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: "",
      password: "",
      showWalletConnectModal: false,
      showSheet: false,
      walletConnect: false,
      connector: '',
      web3: '',
      account: ''
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    localStorage.setItem('membershipWithExpiry', params.membershipWithExpiry ? params.membershipWithExpiry : false);
    if (params.dokuId) localStorage.setItem('dokuId', params.dokuId);
    const signupOrLoginMethod = localStorage.getItem('signupOrLoginMethod');
    if (signupOrLoginMethod === 'web3') {
      const signIn = localStorage.getItem('signIn');
      if (signIn) {
        this.setState({ showLoader: true });
        const walletAddress = localStorage.getItem('walletAddress');
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let provider;
        if (isMobileDevice) {
          const connector = await wc.connect();
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: {
              [connector.chainId]: await NetworkData.networks[connector.chainId],
            },
          });
          await walletConnectProvider.enable();
          provider = walletConnectProvider;
        } else {
          provider = Web3.givenProvider;
        }
        const web3 = new Web3(provider);
        this.checkIfDataStoredOnBlockchain(web3, walletAddress);
      }
    } else if (signupOrLoginMethod === 'web2') {
      let user = localStorage.getItem('user');
      if (user) {
        user = JSON.parse(user);
        this.props.history.push({
          pathname: '/profile-detail-page',
          state: {
            email: user.emails[0].address,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            userName: user.username,
            displayUsername: user.displayUsername,
            signupMethod: 'web2',
            walletAddress: user.walletAddress
          }
        });
      } else {
        this.props.history.push({
          pathname: '/profile-page',
          state: {
            signupMethod: 'web2',
          }
        });
      }
    }
  }

  checkIfDataStoredOnBlockchain = async (web3, walletAddress) => {
    const membershipWithExpiry = GeneralFunctions.getMembershipWithExpiry();
    const contractAddress = membershipWithExpiry
      ? process.env.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY
      : process.env.REACT_APP_CONTRACT_ADDRESS
    const membershipABI_JSON = membershipWithExpiry
      ? membershipWithExpiryABI
      : membershipABI
    const myContract = await new web3.eth.Contract(membershipABI_JSON, contractAddress);
    try {
      let tokenId = localStorage.getItem('tokenId');
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
        this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
      } else {
        this.props.history.push({
          pathname: '/profile-page',
          state: {
            signupMethod: 'web3',
            walletAddress
          }
        });
      }
    } catch (error) {
      let message = error.message || error.Error;
      if (message.toLowerCase().includes('invalid token id')) {
        this.props.history.push({
          pathname: '/profile-page',
          state: {
            signupMethod: 'web3',
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

  authenticate = async () => {
    try {
      this.setState({ showLoader: true, showSheet: false });
      const signIn = localStorage.getItem('signIn');
      if (signIn) {
        Server.sendDataToMobileApp(JSON.stringify({ message: 'Login Successfull' }));
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
              version: '1',
              statement: message,
              nonce: await GeneralFunctions.getUid(16, 'alphaNumeric'),
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
            version: '1',
            statement: message,
            nonce: await GeneralFunctions.getUid(16, 'alphaNumeric'),
          });
          messageToSign = siwe.prepareMessage();
          signature = await web3.eth.personal.sign(messageToSign, this.state.account);
        }
        let signatureVerified = await Server.request({
          url: '/web3Auth/verifySignMessage',
          method: "POST",
          data: {
            messageToSign,
            signature
          }
        });
        if (signatureVerified.success) {
          this.setState({ showLoader: false });
          localStorage.setItem('signIn', true);
          localStorage.setItem('signupOrLoginMethod', 'web3');
          localStorage.setItem('chainId', chainId);
          localStorage.setItem('walletAddress', signatureVerified.walletAddress);
          Object.assign(response, { signupMethod: 'web3' });
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

  login = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/web2Auth/login",
        method: "POST",
        data: {
          email: this.state.email,
          password: this.state.password,
        }
      });
      if (response.success) {
        this.setState({ showLoader: false });
        localStorage.setItem('signupOrLoginMethod', 'web2');
        localStorage.setItem('user', JSON.stringify(response.user));
        Object.assign(response, { signupMethod: 'web2' });
        Server.sendDataToMobileApp(JSON.stringify(response));
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  toggleWalletConnectModal = () => {
    this.setState({ showWalletConnectModal: !this.state.showWalletConnectModal });
  };

  onDismiss = () => {
    this.setState({ showSheet: false });
  }

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <div
          style={{
            height: "100vh",
            // justifyContent: "center",
            flexDirection: "column",
            display: "flex",
            marginTop: 20,
          }}
        >
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Col
              md="3"
              sm="4"
              style={{
                width: "90%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Row
                style={{
                  justifyContent: "end",
                  alignItems: "center",
                }}
              >
                <Button
                  style={{
                    padding: "13px 30px",
                    fontSize: "15px",
                    fontWeight: "bold",
                    marginBottom: "30px",
                  }}
                  className="btn-round"
                  color="info"
                  type="button"
                  size="lg"
                  outline
                  to="/signup-page"
                  tag={Link}
                >
                  Sign Up
                </Button>
              </Row>
              <Row
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  style={{
                    width: "100%",
                    padding: "13px 0px",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                  onClick={this.toggleWalletConnectModal}
                  className="btn-round"
                  color="info"
                  type="button"
                  size="lg"
                >
                  Log in with Web 3.0 Wallet
                </Button>
              </Row>
              <hr
                style={{
                  color: "gray",
                  backgroundColor: "gray",
                  height: 1,
                  marginLeft: 40,
                  marginRight: 40,
                }}
              />
              <div
                style={{
                  backgroundColor: "gray",
                  width: 26,
                  height: 26,
                  borderRadius: 20,
                  padding: 2,
                  position: "absolute",
                  top: "42%",
                  left: "47%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <h6 style={{ color: "white", marginBottom: 0 }}>OR</h6>
              </div>
              <Form onSubmit={(event) => this.login(event)}>
                <Row
                  style={{
                    justifyContent: "center",
                    marginLeft: 10,
                    marginRight: 10,
                    marginTop: 40,
                  }}
                >
                  <FormGroup style={{ width: "100%" }}>
                    <Input
                      style={{
                        marginBottom: 10,
                        width: "100%",
                        borderColor: "gray",
                      }}
                      placeholder="Email"
                      type="email"
                      value={this.state.email}
                      onChange={(event) =>
                        this.setState({ email: event.target.value })
                      }
                      required
                    ></Input>
                    <Input
                      style={{
                        marginBottom: 10,
                        width: "100%",
                        borderColor: "gray",
                      }}
                      placeholder="Password"
                      type="password"
                      value={this.state.password}
                      onChange={(event) =>
                        this.setState({ password: event.target.value })
                      }
                      required
                    ></Input>
                  </FormGroup>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Button
                    style={{
                      width: "100%",
                      padding: "13px 0px",
                      fontSize: "15px",
                      fontWeight: "bold",
                    }}
                    className="btn-round"
                    color="info"
                    type="submit"
                    size="lg"
                  >
                    Log in with email
                  </Button>
                </Row>
              </Form>
            </Col>
          </Row>
        </div>
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
        {this.state.showWalletConnectModal ? (
          <Modal
            isOpen={this.state.showWalletConnectModal}
            toggle={(event) => this.toggleWalletConnectModal()}
            className="modal-md"
            style={{ width: "90%" }}
            centered
          >
            <ModalHeader toggle={(event) => this.toggleWalletConnectModal()}>
              Connect Account
            </ModalHeader>
            <ModalBody>
              <Row>
                <Col sm={12}>
                  <Button
                    onClick={() => this.connectWallet(false)}
                    style={{
                      width: "100%",
                      padding: "10px 29px",
                      fontSize: "21px",
                      fontWeight: "bold",
                      color: "gray",
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
                      MetaMask
                    </label>
                    <img
                      style={{
                        cursor: "pointer",
                        float: "right",
                        width: "30px",
                      }}
                      alt="..."
                      className="rounded-circle"
                      src="metamask.png"
                    ></img>
                  </Button>
                </Col>
                <Col sm={12}>
                  <Button
                    onClick={() => this.connectWallet(true)}
                    style={{
                      width: "100%",
                      padding: "10px 29px",
                      fontSize: "21px",
                      fontWeight: "bold",
                      color: "gray",
                    }}
                    className="btn-round"
                    color="info"
                    type="button"
                    size="lg"
                    outline
                  >
                    <label
                      style={{
                        float: "left",
                        marginBottom: "0px",
                      }}
                    >
                      WalletConnect
                    </label>
                    <img
                      style={{
                        float: "right",
                        width: "30px",
                        marginTop: "5px",
                      }}
                      alt="..."
                      className="rounded-circle"
                      src="walletConnect.png"
                    ></img>
                  </Button>
                </Col>
                <Col sm={12}>
                  <Row style={{ justifyContent: "center", margin: "20px 0px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "25px",
                        fontWeight: "bold",
                      }}
                    >
                      What is a wallet?
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "center", margin: "0px 0px" }}>
                    <div
                      style={{
                        color: "black",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      A Home for your Digital Assets
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "center", margin: "0px 30px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      Wallets are used to send, receive, store, and display
                      digital assets like Ethereum and NFTS
                    </div>
                  </Row>
                  <Row
                    style={{
                      justifyContent: "center",
                      margin: "0px 0px",
                      marginTop: "20px",
                    }}
                  >
                    <div
                      style={{
                        color: "black",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      A New Way to Log In
                    </div>
                  </Row>
                  <Row style={{ justifyContent: "center", margin: "0px 30px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      Instead of creating new accounts and passwords on every
                      website, just connect your wallet
                    </div>
                  </Row>
                </Col>
                <Col sm={12}>
                  <Row style={{ justifyContent: "center", margin: "0px 30px" }}>
                    <Button
                      style={{
                        marginTop: 35,
                        width: "70%",
                        padding: "13px 0px",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      onClick={async () =>
                        await Server.sendDataToMobileApp(
                          JSON.stringify({ message: "getWallet" })
                        )
                      }
                      className="btn-round"
                      color="info"
                      type="button"
                      size="lg"
                    >
                      Get a Wallet
                    </Button>
                  </Row>
                  <Row style={{ justifyContent: "center", margin: "0px 30px" }}>
                    <div
                      style={{
                        color: "gray",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      Learn More
                    </div>
                  </Row>
                </Col>
              </Row>
            </ModalBody>
          </Modal>
        ) : null}
        <BottomSheet
          open={this.state.showSheet}
          snapPoints={({ minHeight }) => minHeight}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #1434A4;
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
              onClick={this.authenticate}
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

export default LoginPage;