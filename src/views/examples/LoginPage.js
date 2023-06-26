import Web3 from 'web3';
import { SiweMessage } from 'siwe';
import OtpInput from "react-otp-input";
import { Link } from "react-router-dom";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { BsFillCheckCircleFill } from "react-icons/bs";
import {
  Row,
  Col,
  Input,
  Form,
  FormGroup,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  InputGroup,
  InputGroupText
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
      showPassword: false,
      setPassword: false,
      showWalletConnectModal: false,
      showSheet: false,
      walletConnect: false,
      connector: '',
      web3: '',
      account: '',
      showOTPage: false,
      reconstructKeyPage: false,
      keyShare1: "",
      keyShare2: "",
      rpcUrl: "https://matic-mumbai.chainstacklabs.com",
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
      } else {
        const walletAddress = localStorage.getItem('walletAddress');
        const tokenId = localStorage.getItem('tokenId');
        if (walletAddress && tokenId) {
          this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
        }
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
            signature,
            walletAddress: this.state.account
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

  sendOTP = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/sendOTP",
        method: "POST",
        data: {
          email: this.state.email
        }
      });
      if (response.success) {
        this.setState({ showLoader: false, showOTPage: true });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  verifyOTP = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/verifyOTP",
        method: "POST",
        data: {
          email: this.state.email,
          otp: this.state.otp,
          verifyOTPFrom: "login"
        }
      });
      if (response.success) {
        localStorage.setItem("signupOrLoginMethod", "web3");
        if (response.privateKeyCreated) {
          this.setState({
            showLoader: false,
            showOTPage: false,
            reconstructKeyPage: true,
            keyShare1: response.keyShare1
          });
        } else {
          throw Error("User not found. Please register account first");
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

  verifyPassword = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/web3Auth/verifyPassword",
        method: "POST",
        data: {
          email: this.state.email,
          password: this.state.password
        }
      });
      if (response.success) {
        this.setState({
          showLoader: false,
          password: "",
          setPassword: true,
          keyShare2: response.keyShare2
        });
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

  reconstructPrivateKey = async () => {
    try {
      this.setState({ showLoader: true });
      const privateKey = await GeneralFunctions.decrypt(`${this.state.keyShare1}${this.state.keyShare2}`);
      let web3 = new Web3(this.state.rpcUrl);
      let account = web3.eth.accounts.privateKeyToAccount(privateKey);
      localStorage.setItem("privateKey", privateKey);
      localStorage.setItem("walletAddress", account.address);
      let response = await Server.request({
        url: '/web3Auth/loginWithEmail',
        method: "POST",
        data: {
          walletAddress: account.address
        }
      });
      if (response.success) {
        this.setState({ showLoader: false });
        localStorage.setItem('signupOrLoginMethod', 'web3');
        localStorage.setItem('tokenId', response.user.tokenId);
        localStorage.setItem('walletAddress', response.walletAddress);
        Object.assign(response, { signupMethod: 'web3' });
        Server.sendDataToMobileApp(JSON.stringify(response));
      } else {
        throw Error(response.message);
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  }

  toggleWalletConnectModal = () => {
    this.setState({ showWalletConnectModal: !this.state.showWalletConnectModal });
  };

  onDismiss = () => {
    this.setState({ showSheet: false });
  }

  getWidth = () => {
    let width = window.innerWidth;
    if (width <= 220) {
      return "5px";
    }
    else if (width > 220 && width <= 300) {
      return "10px";
    }
    else if (width > 300 && width <= 350) {
      return "20px";
    }
    else if (width > 350 && width <= 400) {
      return "30px";
    }
    else if (width > 400 && width <= 480) {
      return "40px";
    }
    else if (width > 480) {
      return "50px";
    }
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
        >{this.state.showOTPage
          ? <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Col
              sm="12"
              style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
            >
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "25px",
                    fontWeight: "500",
                  }}
                >
                  A verification code will be sent to your email to reconstruct a wallet address for you.
                </div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "25px",
                    fontWeight: "500",
                  }}
                >
                  Enter the code here:
                </div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "25px",
                    fontWeight: "500",
                  }}
                >
                  <OtpInput
                    className="d-flex justify-content-center"
                    inputStyle={{
                      color: "black",
                      width: this.getWidth(),
                      height: "50px",
                      margin: "0 5px",
                      fontSize: "25px",
                      borderRadius: "5px",
                      border:
                        "1px solid rgba(0,0,0,0.3)",
                      outlineColor: "#17517b",
                    }}
                    isInputNum={true}
                    value={this.state.otp}
                    onChange={(value) =>
                      this.setState({
                        otp: value,
                      })
                    }
                    numInputs={6}
                    separator={<span style={{ color: "black" }}>-</span>}
                  />
                </div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
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
                  onClick={this.verifyOTP}
                >
                  Continue
                </Button>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "100px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "25px",
                    fontWeight: "bold",
                  }}
                >What is a wallet?</div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "black",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >A Home for your Digital Assets</div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "0px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTS</div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "20px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "black",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >A New Way to Log In</div>
              </Row>
              <Row style={{ justifyContent: "flex-start", margin: "0px 30px 5px 30px" }}>
                <div
                  style={{
                    color: "gray",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >Instead of creating new accounts and passwords on every website, just connect your wallet</div>
              </Row>
              <Row style={{ justifyContent: "center", margin: "30px 30px" }}>
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
          : this.state.reconstructKeyPage
            ? <Row style={{ justifyContent: "center", alignItems: "center" }}>
              <Col
                sm="12"
                style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
              >
                <Row style={{ justifyContent: "center", margin: "20px" }}>
                  <div
                    style={{
                      color: "gray",
                      fontSize: "25px",
                      fontWeight: "bold",
                    }}
                  >
                    Authentication factors
                  </div>
                </Row>
                <Row style={{ justifyContent: "center", margin: "20px" }}>
                  <div
                    style={{
                      color: "gray",
                      fontSize: "25px",
                      fontWeight: "bold",
                    }}
                  >
                    Pair key with an authentication factor.
                  </div>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    margin: "20px",
                    border: "1px solid gray",
                    borderRadius: "15px",
                    padding: "20px 15px"
                  }}
                >
                  <Col sm={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <BsFillCheckCircleFill
                      size="35"
                      color="#2ca8ff"
                    />
                  </Col>
                  <Col sm={12} className="mt-2" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <h5 style={{ fontWeight: 700 }}>Pair with your google account</h5>
                  </Col>
                  <Col sm={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Input
                      style={{ borderColor: "gray" }}
                      value={this.state.email}
                      disabled
                    ></Input>
                  </Col>
                  <Col sm={12} className="mt-4" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Input
                      style={{ borderColor: "gray" }}
                      value={this.state.keyShare1}
                      disabled
                    ></Input>
                  </Col>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    margin: "20px",
                    border: "1px solid gray",
                    borderRadius: "15px",
                    padding: "20px 15px"
                  }}
                >
                  <Col sm={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {this.state.setPassword
                      ? <BsFillCheckCircleFill
                        size="35"
                        color="#2ca8ff"
                      />
                      : <img
                        style={{ height: "85px", width: "85px" }}
                        alt="..."
                        src="set_password.png"
                      />
                    }
                  </Col>
                  <Col sm={12} className="mt-2" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <h5 style={{ fontWeight: 700 }}>Enter recovery password</h5>
                  </Col>
                  {this.state.setPassword
                    ? <Col sm={12} className="mt-4" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <Input
                        style={{ borderColor: "gray" }}
                        value={this.state.keyShare2}
                        disabled
                      ></Input>
                    </Col>
                    : <>
                      <Col sm={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <InputGroup>
                          <Input
                            style={{ borderColor: "gray" }}
                            value={this.state.password}
                            placeholder="create password"
                            type={this.state.showPassword ? "text" : "password"}
                            required
                            onChange={(event) => this.setState({ password: event.target.value })}
                          />
                          <InputGroupText
                            style={{
                              borderColor: "gray",
                              borderTopLeftRadius: "0px",
                              borderBottomLeftRadius: "0px",
                              backgroundColor: "#E3E3E3",
                              padding: "0px 20px"
                            }}
                          >
                            {this.state.showPassword
                              ? <IoMdEyeOff
                                size="20"
                                style={{ cursor: "pointer" }}
                                onClick={() => this.setState({ showPassword: false })}
                              />
                              : <IoMdEye
                                size="20"
                                style={{ cursor: "pointer" }}
                                onClick={() => this.setState({ showPassword: true })}
                              />
                            }
                          </InputGroupText>
                        </InputGroup>
                      </Col>
                      <Col sm={12} className="mt-1" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Button
                          style={{
                            width: "100%",
                            padding: "13px 0px",
                            fontSize: "15px",
                            fontWeight: "bold",
                          }}
                          className="btn-round"
                          color="info"
                          size="lg"
                          onClick={this.verifyPassword}
                        >
                          Enter password
                        </Button>
                      </Col>
                    </>
                  }
                </Row>
                {this.state.setPassword
                  &&
                  <Row
                    style={{
                      justifyContent: "center",
                      margin: "20px"
                    }}
                  >
                    <Button
                      style={{
                        width: "100%",
                        padding: "13px 0px",
                        fontSize: "15px",
                        fontWeight: "bold",
                        margin: 0
                      }}
                      className="btn-round"
                      color="info"
                      size="lg"
                      onClick={this.reconstructPrivateKey}
                    >
                      Reconstruct your key
                    </Button>
                  </Row>
                }
              </Col>
            </Row >
            : <Row style={{ justifyContent: "center", alignItems: "center" }}>
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
                    top: "50.5%",
                    left: "47%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <h6 style={{ color: "white", marginBottom: 0 }}>OR</h6>
                </div>
                {/* Web2 login with email and passowrd */}
                {/* <Form onSubmit={(event) => this.login(event)}>
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
              </Form> */}

                {/* Email login with OTP */}
                <Form onSubmit={(event) => this.sendOTP(event)}>
                  <Row
                    style={{
                      justifyContent: "center",
                      marginLeft: 10,
                      marginRight: 10,
                      marginTop: 20,
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
          }
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