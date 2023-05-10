import Web3 from 'web3';
import { SiweMessage } from 'siwe';
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import { FaChevronLeft } from 'react-icons/fa';
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
  FormFeedback,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import * as Server from "../../utils/Server";
import * as NetworkData from 'utils/networks';
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const wc = new WalletConnect();

class SignUpPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: '',
      password: '',
      confirmPassword: '',
      invalidPassword: false,
      showWalletConnectModal: false
    };
  }

  checkIfDataStoredOnBlockchain = async (web3, walletAddress) => {
    const myContract = await new web3.eth.Contract(membershipABI, process.env.REACT_APP_CONTRACT_ADDRESS);
    const response = await myContract.methods
      .getUser(walletAddress)
      .call();
    if (response && response.metaData) {
      this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}`);
    } else {
      this.props.history.push({
        pathname: '/profile-page',
        state: {
          signupMethod: 'web3',
          walletAddress
        }
      });
    }
  }

  authenticate = async (walletConnect) => {
    try {
      this.setState({ showLoader: true, showWalletConnectModal: false });
      const signIn = localStorage.getItem('signIn');
      if (signIn) {
        const walletAddress = localStorage.getItem('walletAddress');
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let provider;
        if (isMobileDevice || walletConnect) {
          const connector = await wc.connect();
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: { [connector.chainId]: await NetworkData.networks[connector.chainId] }
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
        if (isMobileDevice || walletConnect) {
          const connector = await wc.connect();
          chainId = connector.chainId;
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: { [chainId]: await NetworkData.networks[chainId] }
          });
          await walletConnectProvider.enable();
          web3 = new Web3(walletConnectProvider);
          const account = connector.accounts.length ? connector.accounts[0] : null;
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
            await new Promise((resolve, reject) => {
              setTimeout(async () => {
                try {
                  signature = await connector.signPersonalMessage([account, messageToSign]);
                } catch (error) {
                  reject(new Error(error.message || error));
                }
                clearTimeout();
                resolve();
              }, 5000);
            });
          }
        } else {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          web3 = new Web3(Web3.givenProvider);
          const account = Web3.utils.toChecksumAddress(accounts[0]);
          chainId = await web3.eth.getChainId();
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
          signature = await web3.eth.personal.sign(messageToSign, account);
        }
        let signatureVerified = await Server.request({
          url: '/web3Auth/connectWallet',
          method: "POST",
          data: {
            messageToSign,
            signature
          }
        });
        if (signatureVerified.success) {
          this.setState({ showLoader: false });
          localStorage.setItem('signIn', true);
          localStorage.setItem('chainId', chainId);
          localStorage.setItem('walletAddress', signatureVerified.walletAddress);
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


  toggleWalletConnectModal = () => {
    this.setState({ showWalletConnectModal: !this.state.showWalletConnectModal });
  };

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
            marginTop: 20
          }}
        >
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Col
              md="3"
              sm="4"
              style={{ width: "90%", justifyContent: "center", alignItems: "center" }}
            >
              <Row
                style={{
                  justifyContent: "start",
                  alignItems: "center",
                  marginLeft: 0
                }}
              >
                <FaChevronLeft
                  size="20"
                  style={{
                    cursor: 'pointer',
                    marginBottom: '30px'
                  }}
                  onClick={() => this.props.history.push('/login-page')}
                />
              </Row>
              <Row
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 35,
                }}
              >
                <Button
                  style={{
                    width: "100%",
                    padding: '13px 0px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                  }}
                  onClick={this.toggleWalletConnectModal} className="btn-round" color="info" type="button" size="lg">
                  Connect Web3 Wallet
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
                  top: "29%",
                  left: "47%",
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <h6 style={{ color: "white", marginBottom: 0 }}>OR</h6>
              </div>
              <Row
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 35,
                }}
              >
                <h3 style={{ color: "gray" }}>Sign up with email</h3>
              </Row>
              <Form
                onSubmit={() => this.props.history.push({
                  pathname: '/profile-page',
                  state: {
                    email: this.state.email,
                    password: this.state.password,
                    confirmPassword: this.state.confirmPassword,
                    signupMethod: 'web2'
                  }
                })}
              >
                <Row
                  style={{
                    justifyContent: "center",
                    marginLeft: 30,
                    marginRight: 40,
                  }}
                >
                  <FormGroup style={{ width: "100%" }}>
                    <Input
                      style={{ marginBottom: 10, width: "100%", borderColor: 'gray' }}
                      value={this.state.email}
                      placeholder="Enter email"
                      type="email"
                      required
                      onChange={(event) => this.setState({ email: event.target.value })}
                    ></Input>
                  </FormGroup>
                  <FormGroup style={{ width: "100%" }}>
                    <Input
                      style={{ marginBottom: 10, width: "100%", borderColor: 'gray' }}
                      value={this.state.password}
                      placeholder="create password"
                      type="password"
                      required
                      onChange={(event) => this.setState({ password: event.target.value })}
                    ></Input>
                  </FormGroup>
                  <FormGroup style={{ width: "100%" }}>
                    <Input
                      style={{ width: "100%", borderColor: 'gray' }}
                      value={this.state.confirmPassword}
                      placeholder="confirm password"
                      type="password"
                      required
                      invalid={this.state.invalidPassword}
                      onChange={(event) => {
                        this.setState({ confirmPassword: event.target.value }, () => {
                          if (this.state.password !== this.state.confirmPassword) {
                            this.setState({ invalidPassword: true })
                          } else {
                            this.setState({ invalidPassword: false })
                          }
                        })
                      }}
                    ></Input>
                    <FormFeedback>
                      Password mismatch
                    </FormFeedback>
                  </FormGroup>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center" }}>
                  <Button
                    style={{
                      width: "100%",
                      padding: '13px 0px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                    }}
                    className="btn-round" color="info" type="submit" size="lg"
                    disabled={this.state.invalidPassword}
                  >
                    Sign up
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
            <ModalHeader
              toggle={(event) => this.toggleWalletConnectModal()}
            >
              Connect Account
            </ModalHeader>
            <ModalBody>
              <Row>
                <Col sm={12}>
                  <Button
                    onClick={() => this.authenticate(false)}
                    style={{
                      width: '100%',
                      padding: '10px 29px',
                      fontSize: '21px',
                      fontWeight: 'bold',
                      color: 'gray',
                    }}
                    className="btn-round" color="info" type="button" size="lg" outline>
                    <label
                      style={{
                        float: 'left',
                        marginBottom: '0px'
                      }}
                    >
                      MetaMask
                    </label>
                    <img
                      style={{ float: 'right', width: '30px' }}
                      alt="..."
                      className="rounded-circle"
                      src="metamask.png"
                    ></img>
                  </Button>
                </Col>
                <Col sm={12}>
                  <Button
                    onClick={() => this.authenticate(true)}
                    style={{
                      width: '100%',
                      padding: '10px 29px',
                      fontSize: '21px',
                      fontWeight: 'bold',
                      color: 'gray',
                    }}
                    className="btn-round" color="info" type="button" size="lg" outline>
                    <label
                      style={{
                        float: 'left',
                        marginBottom: '0px',
                      }}
                    >
                      WalletConnect
                    </label>
                    <img
                      style={{ float: 'right', width: '30px', marginTop: '5px' }}
                      alt="..."
                      className="rounded-circle"
                      src="walletConnect.png"
                    ></img>
                  </Button>
                </Col>
                <Col sm={12}>
                  <Row style={{ justifyContent: 'center', margin: '20px 0px' }}>
                    <div
                      style={{
                        color: 'gray',
                        fontSize: '25px',
                        fontWeight: 'bold',
                      }}
                    >What is a wallet?</div>
                  </Row>
                  <Row style={{ justifyContent: 'center', margin: '0px 0px' }}>
                    <div
                      style={{
                        color: 'black',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >A Home for your Digital Assets</div>
                  </Row>
                  <Row style={{ justifyContent: 'center', margin: '0px 30px' }}>
                    <div
                      style={{
                        color: 'gray',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTS</div>
                  </Row>
                  <Row style={{ justifyContent: 'center', margin: '0px 0px', marginTop: '20px' }}>
                    <div
                      style={{
                        color: 'black',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >A New Way to Log In</div>
                  </Row>
                  <Row style={{ justifyContent: 'center', margin: '0px 30px' }}>
                    <div
                      style={{
                        color: 'gray',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >Instead of creating new accounts and passwords on every website, just connect your wallet</div>
                  </Row>
                </Col>
                <Col sm={12}>
                  <Row style={{ justifyContent: 'center', margin: '0px 30px' }}>
                    <Button
                      style={{
                        width: "50%",
                        padding: '13px 0px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                      onClick={async () => await Server.sendDataToMobileApp(JSON.stringify({ message: 'getWallet' }))}
                      className="btn-round" color="info" type="button" size="lg"
                    >
                      Get a Wallet
                    </Button>
                  </Row>
                  <Row style={{ justifyContent: 'center', margin: '0px 30px' }}>
                    <div
                      style={{
                        color: 'gray',
                        fontSize: '15px',
                        fontWeight: 'bold',
                      }}
                    >
                      Learn More
                    </div>
                  </Row>
                </Col>
              </Row>
            </ModalBody >
          </Modal >
        ) : null
        }
      </>
    );
  }
}

export default SignUpPage;