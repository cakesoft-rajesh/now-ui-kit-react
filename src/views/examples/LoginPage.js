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
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const wc = new WalletConnect();

class LoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      showWalletConnectModal: false
    };
  }

  authenticate = async (walletConnect) => {
    try {
      this.setState({ showLoader: true, showWalletConnectModal: false });
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
      let signature; let messageToSign;
      if (isMobileDevice || walletConnect) {
        const connector = await wc.connect();
        const account = connector.accounts.length ? connector.accounts[0] : null;
        if (account) {
          const siwe = new SiweMessage({
            domain: window.location.hostname,
            uri: window.location.origin,
            address: account,
            chainId: connector.chainId,
            version: '1',
            statement: message,
            nonce: await GeneralFunctions.getUid(16, 'alphaNumeric'),
          });
          messageToSign = siwe.prepareMessage();
          await new Promise((resolve, reject) => {
            setTimeout(async () => {
              signature = await connector.signPersonalMessage([account, messageToSign]);
              clearTimeout();
              resolve();
            }, 5000);
          })
        }
      } else {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const web3 = new Web3(Web3.givenProvider);
        const account = Web3.utils.toChecksumAddress(accounts[0]);
        const siwe = new SiweMessage({
          domain: window.location.hostname,
          uri: window.location.origin,
          address: account,
          chainId: await web3.eth.getChainId(),
          version: '1',
          statement: message,
          nonce: await GeneralFunctions.getUid(16, 'alphaNumeric'),
        });
        messageToSign = siwe.prepareMessage();
        signature = await web3.eth.personal.sign(messageToSign, account);
      }
      let signatureVerified = await Server.request({
        url: `/verifySignMessage?messageToSign=${messageToSign}&signature=${signature}`,
        method: "GET",
        // data: {
        //   messageToSign,
        //   signature
        // }
      });
      if (signatureVerified.success) {
        this.setState({ showLoader: false });
        // GeneralFunctions.setAuthUser(signatureVerified.user);
        // GeneralFunctions.setPermissions(signatureVerified.user.role);
        // GeneralFunctions.setAuthorizationHeader(signatureVerified.token);
        localStorage.setItem("loggedInUsingWallet", true);
        localStorage.setItem("walletAddress", signatureVerified.address);
        this.props.history.push("/profile-page");
        // window.location.reload();
      } else {
        throw Error(signatureVerified.message);
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
            justifyContent: "center",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Col
              md="3"
              sm="4"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <Row
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 35,
                }}
              >
                <Button onClick={this.toggleWalletConnectModal} className="btn-round" color="info" type="button" size="lg">
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
                  top: "21%",
                  left: "47%",
                }}
              >
                <h7 style={{ color: "white" }}>OR</h7>
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
                    defaultValue=""
                    placeholder="Enter email"
                    type="email"
                  ></Input>
                  <Input
                    style={{ marginBottom: 10, width: "100%", borderColor: 'gray' }}
                    defaultValue=""
                    placeholder="create password"
                    type="password"
                  ></Input>
                  <Input
                    style={{ marginBottom: 30, width: "100%", borderColor: 'gray' }}
                    defaultValue=""
                    placeholder="confirm password"
                    type="password"
                  ></Input>
                </FormGroup>
              </Row>
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Button className="btn-round" color="info" type="button" size="lg" to="/profile-page" tag={Link}>
                  Sign up
                </Button>
              </Row>
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
              </Row>
            </ModalBody>
          </Modal>
        ) : null}
      </>
    );
  }
}

export default LoginPage;